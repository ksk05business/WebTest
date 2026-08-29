INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', 'アルファベットの一定シフト', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

ある暗号で「WORD」は「ZRUG」、「TEST」は「WHVW」と表される。同じ規則で「PLAY」はどう表されるか。', NULL, '["SOEB","SNDC","SODB","ROCB","TPEB"]', 2, '["アルファベット順で、それぞれの文字が「3文字後ろ」にずれる規則です。Pの3文字後ろはS、Lの3文字後ろはO、Aの3文字後ろはD、Yの3文字後ろはB（Zの次はAに戻る）となるため、「SODB」となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', 'アルファベットの変則シフト（マイナス）', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

ある暗号で「BAND」は「AYKZ」、「FIRE」は「EGOA」と表される。同じ規則で「CUTE」はどう表されるか。', NULL, '["BTRB","BSQA","ATQA","BSPA","CRQA"]', 1, '["1文字目が「1文字前」、2文字目が「2文字前」、3文字目が「3文字前」、4文字目が「4文字前」にずれる規則です。Cの1文字前はB、Uの2文字前はS、Tの3文字前はQ、Eの4文字前はAとなるため、「BSQA」となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', '五十音の行を数値化', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

「さくら」を暗号化すると「3・2・9」になる。同じ規則で「はやし」を暗号化するといくつになるか。', NULL, '["6・8・3","6・7・3","5・8・3","6・8・2","5・7・2"]', 0, '["五十音の「行」を数字（あ行＝1、か行＝2、さ行＝3…わ行＝10）に変換する暗号です。「さ・く・ら」はそれぞれ「さ行（3）・か行（2）・ら行（9）」です。これに従うと「は・や・し」は「は行（6）・や行（8）・さ行（3）」となるため、「6・8・3」が正解です。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', 'N進数（2進数）', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

アルファベットの位置（A＝0、B＝1、C＝2……）を5桁の2進数で表す暗号がある。Cは「00010」、Iは「01000」と表される。同じ規則で「S」はどう表されるか。', NULL, '["01110","10010","10001","10100","11000"]', 1, '["A=0から数えると、Sは18番目（18）です。18を2進数で表すと、16の位が1、2の位が1となるため「10010」となります。（1×16 + 0×8 + 0×4 + 1×2 + 0×1 = 18）"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', 'アルファベットの逆順数値化', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

ある暗号で「SUN」は「8・6・13」と表される。同じ規則で「MOON」はどう表されるか。', NULL, '["14・12・12・13","13・11・11・12","14・11・11・13","15・12・12・14","14・13・13・13"]', 0, '["アルファベットをZから逆順に数えた数字（Z=1、Y=2……A=26）に変換する規則です。Mは逆から数えて14番目、Oは12番目、Nは13番目となるため、「14・12・12・13」となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', 'アルファベットの交互シフト', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

ある暗号で「MAKE」は「OYMC」と表される。同じ規則で「DATE」はどう表されるか。', NULL, '["FCVC","FZXG","EYUC","FYVC","FYWD"]', 3, '["1文字目は「2文字後ろ」、2文字目は「2文字前」、3文字目は「2文字後ろ」、4文字目は「2文字前」にずれる交互の規則です。Dの2文字後ろはF、Aの2文字前はY、Tの2文字後ろはV、Eの2文字前はCとなるため、「FYVC」となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', '五十音の行・段の組み合わせ', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

「あさ」を暗号化すると「11・31」、「とけい」を暗号化すると「45・24・12」になる。同じ規則で「ゆき」を暗号化するといくつになるか。', NULL, '["82・23","83・22","38・22","83・21","93・22"]', 1, '["最初の数字が「あかさたな…の行（1〜10）」を表し、次の数字が「あいうえおの段（1〜5）」を表しています。「ゆ」はや行（8）のう段（3）で「83」、「き」はか行（2）のい段（2）で「22」となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', '単語の文字数と母音の数の和', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

「APPLE」は「7」、「ORANGE」は「9」と表される。同じ規則で「STRAWBERRY」はどう表されるか。', NULL, '["10","11","12","13","14"]', 2, '["「英単語の文字数 ＋ 含まれる母音（A,I,U,E,O）の数」という規則です。APPLEは5文字＋母音2つで7。ORANGEは6文字＋母音3つで9。STRAWBERRYは10文字＋母音2つ（A,E。Yは子音扱い）で12となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', '五十音の母音・行番号（濁音付き）', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

「小鳥（ことり）」が「52, 54, 29」、「眼鏡（めがね）」が「47, 120, 45」で表されるとき、「16, 320, 39, 17」で表されるのはどれか。', NULL, '["青空（あおぞら）","歯車（はぐるま）","三日月（みかづき）","風車（かざぐるま）","水溜り（みずたまり）"]', 1, '["暗号に「0」が含まれているため濁音が混ざっていることがわかります。「16, 320, 39, 17」を1つずつ解読すると、16→母音「あ（1）」＋「は行（6）」＝は、320→母音「う（3）」＋「が行（20）」＝ぐ、39→母音「う（3）」＋「ら行（9）」＝る、17→母音「あ（1）」＋「ま行（7）」＝ま。したがって「はぐるま（歯車）」になります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', 'アルファベットの増加シフト', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

ある暗号で「JUMP」は「KWPT」と表される。同じ規則で「BEAR」はどう表されるか。', NULL, '["CGDV","CFDU","CGEV","DFEV","CFCV"]', 0, '["1文字目が「1文字後ろ」、2文字目が「2文字後ろ」、3文字目が「3文字後ろ」、4文字目が「4文字後ろ」にずれる規則です。Bの1文字後ろはC、Eの2文字後ろはG、Aの3文字後ろはD、Rの4文字後ろはVとなるため、「CGDV」となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', '母音のアルファベット抽出', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

「みみ」は「I・I」、「ねこ」は「E・O」と表される。同じ規則で「くるま」はどう表されるか。', NULL, '["U・U・O","A・U・U","U・E・A","U・U・A","O・U・A"]', 3, '["日本語をローマ字にした際の「母音のみ」を大文字アルファベットで抜き出す規則です。「くるま（kU-rU-mA）」の母音を順に抜き出すと「U・U・A」となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', 'N進数（3進数）', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

アルファベットの位置（A＝0、B＝1、C＝2……）を3桁の3進数で表す暗号がある。Gは「020」、Hは「021」と表される。同じ規則で「P」はどう表されるか。', NULL, '["112","120","121","200","201"]', 1, '["A=0から数えると、Pは15番目（15）です。15を3進数（9の位、3の位、1の位）で表すと、1×9 ＋ 2×3 ＋ 0×1 ＝ 15となるため、「120」となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', 'アルファベット位置の合計値', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

ある暗号で「PEN」は「35」、「DOG」は「26」と表される。同じ規則で「CUP」はどう表されるか。', NULL, '["38","39","40","41","42"]', 2, '["アルファベット順の番号（A=1、B=2…Z=26）をすべて足し合わせる規則です。C(3) ＋ U(21) ＋ P(16) ＝ 40 となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', '五十音の母音・子音の行番号（濁音付き）', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

「時計（とけい）」が「54, 42, 21」、「朝顔（あさがお）」が「11, 13, 120, 51」で表されるとき、「32, 34, 23, 14」で表されるのはどれか。', NULL, '["雷（かみなり）","窓硝子（まどがらす）","靴下（くつした）","夏休み（なつやすみ）","麦茶（むぎちゃ）"]', 2, '["最初の数字が「母音（あ=1, い=2, う=3, え=4, お=5）」、次の数字が「子音の行（あ行=1, か行=2, さ行=3, た行=4...）」を表しています。濁音は行の数字の後ろに「0」がつきます。「32, 34, 23, 14」を1つずつ解読すると、32→母音「う（3）」＋「か行（2）」＝く、34→母音「う（3）」＋「た行（4）」＝つ、23→母音「い（2）」＋「さ行（3）」＝し、14→母音「あ（1）」＋「た行（4）」＝た。したがって「くつした（靴下）」になります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', '母音のみ数字に変換', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

ある暗号で「BREAD」は「BR21D」と表される。同じ規則で「PAINT」はどう表されるか。', NULL, '["P13NT","P12NT","P14NT","P23NT","P13MT"]', 0, '["子音はそのままで、母音のみをアルファベット順（A=1, E=2, I=3, O=4, U=5）の数字に変換する規則です。PAINTの母音はA(1)とI(3)なので、「P13NT」となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', '五十音の同列シフト（段の移動）', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

ある暗号で「さくら」は「しけり」と表される。同じ規則で「とけい」はどう表されるか。', NULL, '["ちこえ","なこう","たこう","ちきえ","たこえ"]', 2, '["五十音表において、それぞれの文字が「同じ行の1つ次の段」にずれる規則です（お段の次はあ段に戻る）。「と」の次は「た」、「け」の次は「こ」、「い」の次は「う」となるため、「たこう」となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', 'アルファベット位置の2倍', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

ある暗号で「CAT」は「6・2・40」と表される。同じ規則で「DOG」はどう表されるか。', NULL, '["8・30・14","8・28・14","8・30・16","10・30・14","8・32・16"]', 0, '["アルファベット順の番号（A=1、B=2…）をそれぞれ「2倍」にした数字で表す規則です。D(4)×2＝8、O(15)×2＝30、G(7)×2＝14となるため、「8・30・14」となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', 'N進数（4進数）', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

アルファベットの位置（A＝0、B＝1、C＝2……）を2桁の4進数で表す暗号がある。Eは「10」、Jは「21」と表される。同じ規則で「O」はどう表されるか。', NULL, '["30","31","32","33","100"]', 2, '["A=0から数えると、Oは14番目（14）です。14を4進数（4の位、1の位）で表すと、3×4 ＋ 2×1 ＝ 14となるため、「32」となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', '五十音の行と段の足し算', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

「あ」は「2」、「き」は「4」、「す」は「6」と表される。同じ規則で「ふね」はどう表されるか。', NULL, '["8・8","9・9","9・8","8・9","10・9"]', 1, '["「あかさたな…の行の番号（1〜10）」と「あいうえお…の段の番号（1〜5）」を足し合わせた数字にする規則です。（例：す＝さ行(3)＋う段(3)＝6）「ふ」は、は行(6)＋う段(3)＝9。「ね」は、な行(5)＋え段(4)＝9。したがって「9・9」となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
INSERT INTO questions (category, sub_category, title, question_text, tables_json, options, correct_answer, explanation, difficulty, status, originality_note) VALUES ('tgweb_traditional_math', '暗号', 'アルファベットの鏡文字（対称変換）', '暗号の規則性を読み解き、与えられた文字列がどのように表されるか答えなさい。

ある暗号で「BOY」は「Y・L・B」と表される。同じ規則で「GIRL」はどう表されるか。', NULL, '["T・R・J・O","S・R・I・O","T・S・I・O","T・R・I・O","T・R・I・N"]', 3, '["アルファベットの前から数えた順番と、後ろから数えた順番を反転させる規則です（A⇔Z、B⇔Y、C⇔X…）。G(前から7番目)は後ろから7番目のT。I(9番目)はR。R(18番目)はI。L(12番目)はO。よって「T・R・I・O」となります。"]', 4, 'published', 'ユーザー提供のオリジナル問題（TG-WEB従来型非言語: 暗号）');
