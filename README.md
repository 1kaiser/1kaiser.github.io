# 1kaiser.github.io

This repository hosts a 3D Model Gallery web application.

## Current Folder Structure

```ascii
.
├── .idx/
│   ├── dev.nix
│   └── integrations.json
├── .vscode/
│   └── settings.json
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   └── qr-deploy.js
├── models/
│   ├── 20230204temple-transformed.glb
│   ├── 31_10_2024.glb
│   ├── Chicken_Biryani.glb
│   ├── bycycle.glb
│   ├── hibiscus.glb
│   ├── models.js
│   └── momos.glb
├── view/
│   ├── index.html
│   └── mobile_view.js
├── index.html
├── LICENSE
└── README.md
```

## TODO

-   **Refactor Mobile View Page (`view/index.html`)**:
    -   [ ] Replace the embedded JavaScript in `view/index.html` with a script tag linking to the external `view/mobile_view.js`. This will allow the mobile page to use the more robust server selection logic.
    -   [ ] Move inline CSS from `view/index.html` to a dedicated external CSS file (e.g., `view/mobile-styles.css`) and link it.
-   **Consolidate Piping Server Utilities**:
    -   [ ] Create a shared JavaScript module (e.g., `js/piping-utils.js`).
    -   [ ] Move common piping server constants (e.g., `PIPING_SERVERS`) and utility functions (e.g., `findWorkingPipingServer`, `post`, `getWithTimeout`) from `js/qr-deploy.js` and `view/mobile_view.js` into this shared module.
    -   [ ] Update `js/qr-deploy.js` and `view/mobile_view.js` to use this shared module.
-   **CSS Review**:
    -   [ ] Conduct a thorough review of all CSS (`css/styles.css` and any new CSS for the mobile view) to identify and remove any remaining redundancies or style overlaps.
-   **Testing**:
    -   [ ] Perform comprehensive cross-browser and cross-device testing of all application features.
-   **Documentation**:
    -   [ ] Add more detailed comments within the JavaScript files explaining complex sections.
    -   [ ] Expand `README.md` with setup instructions, explanation of features, and contribution guidelines if applicable.