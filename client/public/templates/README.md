This directory holds pre-made Excel templates that the frontend will fetch for "Download Template" buttons.

Expected filenames (examples):

- FanData-template.xlsx
- MotorData-template.xlsx

Public paths used by the app (examples):

- Relative path used in code: `${process.env.PUBLIC_URL || ''}/templates/FanData-template.xlsx`
- Browser/dev server URL (typical CRA): `http://localhost:3000/templates/FanData-template.xlsx`
- Deployed root-relative URL: `/templates/FanData-template.xlsx`

How to use:

1. Put your `.xlsx` template files in this folder (for example `FanData-template.xlsx`).
2. Commit them to your repo (or add them to your deployment static assets). The front-end will fetch them via the paths above.

Notes:

- During development with `npm start` (create-react-app), the file will be served from `http://localhost:3000/templates/<filename>`.
- If you build the app, ensure the `templates` folder is included in the build/static assets (placing them under `public/` ensures that).
