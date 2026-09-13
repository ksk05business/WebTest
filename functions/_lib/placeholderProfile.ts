import { getUniversityCategory } from "../../src/data/universityCategories";
import { parseDesiredOccupations } from "./desiredOccupations";

// 会員登録の必須プロフィール項目（大学・学部・志望業界・希望職種・卒業年月）を
// 登録時点では埋められない2つの経路（メール+パスワードのみの簡易登録、Googleログインでの
// 新規作成）で共通して使う仮の値。users.is_profile_completed = 0 とあわせて使い、
// 本人が後から/mypageで実際の値に更新する前提とする（question-bankスキルと同様、
// このアプリはDB側にフィールドの enum 制約を持たないため任意の文字列を保存できる）。
const PLACEHOLDER_INDUSTRY = "その他";
const PLACEHOLDER_OCCUPATION = "こだわりなし・総合職（オープンコース）等";

export function buildPlaceholderProfile(input?: {
  lastName?: string;
  firstName?: string;
  lastNameRomaji?: string;
  firstNameRomaji?: string;
}) {
  const lastName = input?.lastName || "未設定";
  const firstName = input?.firstName || "未設定";
  const lastNameRomaji = input?.lastNameRomaji || "Unset";
  const firstNameRomaji = input?.firstNameRomaji || "User";
  const facultyType = "未設定";
  const university = "未設定";
  const now = new Date();

  // PLACEHOLDER_OCCUPATIONはsrc/_lib/desiredOccupations.tsの既知の選択肢の一つのため、
  // parseDesiredOccupationsが失敗する（nullを返す）ことはない。
  const desiredOccupationsJson = parseDesiredOccupations([PLACEHOLDER_OCCUPATION]) as string;

  return {
    lastName,
    firstName,
    lastNameRomaji,
    firstNameRomaji,
    facultyType,
    university,
    universityCategory: getUniversityCategory(university),
    industryFirst: PLACEHOLDER_INDUSTRY,
    industrySecond: PLACEHOLDER_INDUSTRY,
    industryThird: PLACEHOLDER_INDUSTRY,
    desiredOccupationsJson,
    graduationYear: now.getFullYear() + 1,
    graduationMonth: 3,
  };
}
