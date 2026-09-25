"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { TAG_TAXONOMY, type TagNode } from "@/src/data/tagTaxonomy";

function findNode(nodes: TagNode[], label: string): TagNode | undefined {
  return nodes.find((n) => n.label === label);
}

// カスケード選択で辿った現在のパス（例: ["Webテスト対策","SPI","非言語"]）から、
// 次に選択可能な階層のノード一覧を返す。パスの末端（それ以上children無し）に達したらnullを返す。
function childrenAtPath(path: string[]): TagNode[] | null {
  let nodes: TagNode[] = TAG_TAXONOMY;
  for (const label of path) {
    const node = findNode(nodes, label);
    if (!node || !node.children || node.children.length === 0) return null;
    nodes = node.children;
  }
  return nodes;
}

// src/data/tagTaxonomy.tsの4階層タクソノミーに基づく、連動型（カスケード）のタグ選択UI。
// 自由入力を廃止し、階層を1段ずつドロップダウンで辿って「追加」した際に、選択パス上の
// 全階層のラベルをフラットなタグ配列へまとめて追加する（例: Webテスト対策>SPI>非言語>推論を
// 選んで追加すると、tagsに"Webテスト対策""SPI""非言語""推論"の4つが追加される）。
export function TagTaxonomyPicker({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [path, setPath] = useState<string[]>([]);

  const levels: TagNode[][] = [TAG_TAXONOMY];
  for (let i = 0; i < path.length; i++) {
    const next = childrenAtPath(path.slice(0, i + 1));
    if (!next) break;
    levels.push(next);
  }

  function handleSelectAt(levelIndex: number, label: string) {
    if (!label) {
      setPath((prev) => prev.slice(0, levelIndex));
      return;
    }
    setPath((prev) => [...prev.slice(0, levelIndex), label]);
  }

  function handleAdd() {
    if (path.length === 0) return;
    const merged = [...tags];
    for (const label of path) {
      if (!merged.includes(label)) merged.push(label);
    }
    onChange(merged);
    setPath([]);
  }

  function handleRemove(label: string) {
    onChange(tags.filter((t) => t !== label));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {levels.map((options, i) => (
          <select
            key={i}
            value={path[i] ?? ""}
            onChange={(e) => handleSelectAt(i, e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">{i === 0 ? "分類を選択" : "（この階層で確定）"}</option>
            {options.map((n) => (
              <option key={n.label} value={n.label}>
                {n.label}
              </option>
            ))}
          </select>
        ))}
        {path.length > 0 && (
          <button
            type="button"
            onClick={handleAdd}
            className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            + 追加（{path.join(" > ")}）
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tags.length === 0 && <span className="text-xs text-gray-400">タグが未選択です</span>}
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
          >
            {t}
            <button
              type="button"
              onClick={() => handleRemove(t)}
              className="text-gray-400 hover:text-red-600"
              aria-label={`${t}を削除`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
