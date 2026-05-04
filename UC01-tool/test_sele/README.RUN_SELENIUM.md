# Huong Dan Chay Test Selenium (WDIO)

Tai lieu nay huong dan ban chay bo test Selenium trong du an Quiz Trivia App.

## 1) Dieu kien can

- Da cai Node.js 18+ (khuyen nghi Node.js 20+)
- Da chay `npm install` trong thu muc `SrcCode`
- Co Chrome/Chromium de WDIO + Chromedriver su dung
- Co tai khoan test creator trong Firebase

## 2) Cau hinh bien moi truong

Tao file:

- `SrcCode/test_sele/.env`

Noi dung mau:

```env
TEST_CREATOR_EMAIL=your_creator_email@example.com
TEST_CREATOR_PASSWORD=your_password
APP_BASE_URL=http://localhost:5173
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

Ghi chu:

- `APP_BASE_URL` mac dinh la `http://localhost:5173` neu khong khai bao.
- `FIREBASE_SERVICE_ACCOUNT_PATH` la tuy chon. Neu bo trong, bo test se thu dung `SrcCode/serviceAccountKey.json`.

## 3) Chuan bi data tu dong tu file UC-01

He thong da duoc cau hinh de lay data tu dong tu:

- `SrcCode/test_sele/data/14_system_test - UC-01.csv`

Ban co the tu chay generator:

```bash
npm run test:data:generate
```

Lenh nay se sinh cac file data:

- `SrcCode/test_sele/data/create-quiz-data.csv`
- `SrcCode/test_sele/data/generated/uc-01-normalized.json`
- `SrcCode/test_sele/data/generated/uc-01-pass.json`
- `SrcCode/test_sele/data/generated/uc-01-fail.json`
- `SrcCode/test_sele/data/generated/uc-01-na.json`

## 4) Chay app local

Mo terminal tai `SrcCode`:

```bash
npm run dev
```

Dam bao app chay duoc tren URL ban dat trong `APP_BASE_URL`.

## 5) Chay Selenium test

Mo terminal moi tai `SrcCode`:

Chay tat ca spec trong WDIO:

```bash
npm run wdio
```

Chay rieng create-quiz spec:

```bash
npm run wdio:quiz
```

Luu y: hai lenh tren se tu dong chay `npm run test:data:generate` truoc khi test.

## 6) Xem report

Sau khi chay xong:

```bash
npm run report
```

## 7) Cau truc chinh lien quan den test

- `SrcCode/test_sele/wdio.conf.ts`: cau hinh WDIO
- `SrcCode/test_sele/specs/create-quiz.e2e.ts`: spec create quiz
- `SrcCode/test_sele/pageobjects/`: page object cho login/create quiz
- `SrcCode/test_sele/utils/testData.ts`: parse va map data UC-01
- `SrcCode/test_sele/scripts/generate-test-data.ts`: sinh bo data tu dong

## 8) Loi thuong gap va cach xu ly

### Khong dang nhap duoc

- Kiem tra lai `TEST_CREATOR_EMAIL`, `TEST_CREATOR_PASSWORD` trong `.env`.
- Kiem tra role creator tren Firebase.

### Khong ket noi duoc app

- Kiem tra app da chay (`npm run dev`).
- Kiem tra `APP_BASE_URL` dung cong/host.

### Loi Firestore Admin

- Kiem tra `serviceAccountKey.json` ton tai va dung quyen.
- Neu dung duong dan khac, set `FIREBASE_SERVICE_ACCOUNT_PATH` dung.
- Neu gap loi `Missing Firebase service account file`, tao file key tai `SrcCode/serviceAccountKey.json` hoac set duong dan day du trong `.env`.

### Loi khong tim thay chromedriver service

- Neu gap loi `Couldn't find plugin "chromedriver" service`, chay lai:

```bash
npm install
```

- Dam bao trong `package.json` co `wdio-chromedriver-service`.

### Loi ChromeDriver khong khop version Chrome

- Neu gap loi `This version of ChromeDriver only supports Chrome version ...`, cap nhat dependency:

```bash
npm install
```

- Neu van loi, cap nhat `chromedriver` trong `package.json` theo major version cua Chrome dang cai.

### Khong tim thay data case

- Kiem tra file `14_system_test - UC-01.csv` con dung header `ID,...`.
- Chay lai `npm run test:data:generate` de regen data.

## 9) Quy trinh de xuat moi lan test

1. Cap nhat file UC-01 neu can.
2. Chay `npm run dev`.
3. Chay `npm run wdio:quiz`.
4. Mo report bang `npm run report`.

Luu y: neu chua co `allure-results`, hay chay `npm run wdio` hoac `npm run wdio:quiz` truoc khi mo report.
