# GAB計数理解（gab_quantitative）の練習問題プールから、模試専用プール（is_mock_only=1）へ
# 87問（29問×3回分）を移動するUPDATE文を生成するスクリプト。
#
# gab_quantitativeは表形式・グラフ形式が同じsub_category（資料の読み取り）を共有しており、
# 単純なORDER BY RANDOM() LIMITでは表・グラフの配分に偏りが出うる（他カテゴリのis_mock_only移行で
# 使っているscoa_mock_only_migration.sql等の単純パターンが使えない）。また表形式の一部は
# passage_group_id（共通の表を使う2問1組）を持つため、これを分断せず常にペアで移動する必要がある。
# この2点を満たすため、Python側でグループ単位のランダム抽出を行い、明示的なIDリストの
# UPDATE文として出力する（D1側の乱数だけでは表現しづらい制約のため）。
#
# 実行方法（環境ごとに1回、wrangler認証済みの状態で）:
#   python scripts/split-gab-quantitative-mock-pool.py local
#   python scripts/split-gab-quantitative-mock-pool.py remote
# 生成された gab_quantitative_mock_migration_<env>.sql を
#   npx wrangler d1 execute webtest-db --<env> --file gab_quantitative_mock_migration_<env>.sql
# で適用する（IDはAUTOINCREMENT値のため環境ごとに異なり、生成物は使い回せない）。

import json
import os
import subprocess
import sys

TABLE_TARGET = 44
GRAPH_TARGET = 43
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run_query(env: str, sql: str) -> list:
    out_path = os.path.join(REPO_ROOT, f"_gab_quant_query_{env}.json")
    with open(out_path, "w", encoding="utf-8") as out:
        subprocess.run(
            ["npx", "wrangler", "d1", "execute", "webtest-db", f"--{env}", "--command", sql, "--json"],
            cwd=REPO_ROOT,
            stdout=out,
            stderr=subprocess.DEVNULL,
            check=True,
            shell=True,
        )
    with open(out_path, encoding="utf-8") as f:
        data = json.load(f)
    os.remove(out_path)
    return data[0]["results"]


def build_groups(rows: list) -> list:
    groups: dict = {}
    for r in rows:
        key = r["passage_group_id"] if r["passage_group_id"] is not None else f"id{r['id']}"
        groups.setdefault(key, []).append(r["id"])
    return list(groups.values())


def select_groups(groups: list, target: int, tries: int = 2000):
    import random

    best = None
    for _ in range(tries):
        shuffled = groups[:]
        random.shuffle(shuffled)
        selected, total = [], 0
        for g in shuffled:
            if total + len(g) <= target:
                selected.append(g)
                total += len(g)
        if total == target:
            return selected, total
        if best is None or abs(total - target) < abs(best[1] - target):
            best = (selected, total)
    return best


def main():
    env = sys.argv[1] if len(sys.argv) > 1 else "local"
    assert env in ("local", "remote"), "usage: split-gab-quantitative-mock-pool.py [local|remote]"

    rows = run_query(
        env,
        "SELECT id, passage_group_id, (tables_json IS NOT NULL) as is_table "
        "FROM questions WHERE category='gab_quantitative' AND is_mock_only=0",
    )
    print(f"[{env}] fetched {len(rows)} candidate rows", file=sys.stderr)

    table_groups = build_groups([r for r in rows if r["is_table"] == 1])
    graph_groups = build_groups([r for r in rows if r["is_table"] == 0])

    table_selected, table_total = select_groups(table_groups, TABLE_TARGET)
    graph_selected, graph_total = select_groups(graph_groups, GRAPH_TARGET)
    assert table_total == TABLE_TARGET, f"table selection off target: {table_total}"
    assert graph_total == GRAPH_TARGET, f"graph selection off target: {graph_total}"

    all_ids = [i for g in table_selected for i in g] + [i for g in graph_selected for i in g]
    print(f"[{env}] selected {len(all_ids)} ids (table {table_total} / graph {graph_total})", file=sys.stderr)

    id_list = ",".join(str(i) for i in all_ids)
    out_sql_path = os.path.join(REPO_ROOT, f"gab_quantitative_mock_migration_{env}.sql")
    with open(out_sql_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(f"UPDATE questions SET is_mock_only = 1 WHERE id IN ({id_list});\n")
    print(f"[{env}] wrote {out_sql_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
