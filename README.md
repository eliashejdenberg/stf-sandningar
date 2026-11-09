# STF sändningar

Hämtar Tyngdlyftnings-TV:s sändningar från Solidsport varje timme och publicerar dem
som `sandningar.json` via GitHub Pages. Sändningsmodulen på tyngdlyftning.com läser filen
och visar sändningarna för en tävling, med tider och omslagsbilder.

## Innehåll

- `scripts/hamta-sandningar.mjs` – hämtar sändningarna och skriver `sandningar.json`.
- `.github/workflows/hamta-sandningar.yml` – kör skriptet varje timme (och vid behov manuellt).
- `sandningar.json` – resultatet. Skrivs bara om när något har ändrats.

## Kom igång

1. Skapa ett **publikt** repo på GitHub, t.ex. `stf-sandningar`, och ladda upp filerna.
2. **Settings → Actions → General → Workflow permissions:** välj *Read and write permissions* och spara.
3. **Settings → Pages:** *Source: Deploy from a branch*, *Branch: main*, mapp */ (root)*. Spara.
4. **Actions → Hämta sändningar → Run workflow** för att hämta direkt.
5. Efter någon minut finns filen på `https://ANVÄNDARNAMN.github.io/stf-sandningar/sandningar.json`.
   Den adressen anges som `Datakälla:` i sändningsmodulen.

## Bra att veta

- Hämtningen använder samma öppna gränssnitt som solidsport.com själv använder. Om
  Solidsport bygger om sin webbplats kan skriptet behöva justeras. Då misslyckas
  körningen under fliken Actions, och GitHub skickar ett mejl. Den senast sparade filen
  ligger kvar, så sidan fortsätter visa tidigare hämtade sändningar.
- GitHub pausar schemalagda körningar i repon utan aktivitet på 60 dagar (det
  mejlas en varning). Klicka då *Enable workflow* under Actions.
- Annan kanal: sätt variabeln `SOLIDSPORT_CHANNEL` i arbetsflödet (standard: `tyngdlyftningstv`).
