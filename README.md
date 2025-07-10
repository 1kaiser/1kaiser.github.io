# 1kaiser.github.io

This repository hosts a 3D Model Gallery web application.

## Acknowledgements

This project leverages several key technologies and AI assistance:

*   [![Jules AI Logo](https://github.com/google-labs-code/jules-awesome-list/blob/main/assets/jules-readme.png?raw=true "AI Development Assistance by Jules")](https://developers.google.com/community/jules)
    **AI Development Assistance**: Initial development, refactoring, feature implementation, and debugging significantly aided by Jules (a large language model from Google).

*   [![Model Viewer Logo](https://avatars.githubusercontent.com/u/58423709?s=40&v=4 "Google <model-viewer>")](https://modelviewer.dev/)
    **[Google `<model-viewer>`](https://modelviewer.dev/)**: For rendering 3D models interactively on the web and enabling AR experiences.

*   [![Three.js Logo](https://threejs.org/files/logo.svg "Three.js")](https://threejs.org/)
    **[Three.js](https://threejs.org/)**: The powerful WebGL library that `<model-viewer>` is built upon for 3D graphics rendering. *(Note: SVG logo, display size and rendering may vary across Markdown viewers.)*

*   [![Draco 3D Logo](https://google.github.io/draco/artwork/draco3d-vert-360x274.png "Google Draco")](https://google.github.io/draco/)
    **[Google Draco](https://google.github.io/draco/)**: For 3D graphics compression, helping reduce the size of the 3D models. *(Note: The provided logo might be large; its display will depend on the Markdown renderer's handling of image sizes.)*

*   **[Piping Server](https://github.com/nwtgck/piping-server)**: Used to facilitate the real-time transfer of model data for the 'Deploy to Mobile' QR code feature. (Textual acknowledgement as no distinct project logo).

## Key Features

*   **3D Model Display**: View various 3D models (GLB format).
*   **Interactive Gallery**:
    *   **Horizontal Scrolling Strip**: Browse models in a horizontally scrolling list.
    *   **Click-to-Load Models**: 3D models are loaded on demand when clicked, optimizing initial page load performance.
*   **Modal View**: Click on a model to see an enlarged view in a modal window.
*   **Download Models**: Download the source `.glb` file for each model.
*   **Deploy to Mobile (QR Code)**: Generate a QR code to easily view models on a mobile device, often enabling AR views.
    *   Uses piping servers for data transfer without permanent server-side storage.
    *   Supports AR mode selection (Scene Viewer default).
*   **Responsive Design**: Adapts to different screen sizes (though the horizontal gallery is the primary layout now).

## Recent Improvements

*   **Mobile View Page Refactor (`view/index.html`)**:
    *   Externalized all inline CSS into a dedicated `view/mobile-view.css` file, cleaning up the HTML structure.
    *   Replaced the embedded JavaScript logic with the more robust and feature-rich external `view/mobile_view.js`, enhancing the reliability and capabilities of the mobile viewing page.
*   **Enhanced Modal UX (User Experience)**:
    *   The modal window now intelligently waits for the selected 3D model to finish loading in its gallery card before appearing, providing a smoother experience.
    *   Fixed an issue where the modal might not reopen correctly for the same model or could briefly show a previously viewed model; the modal's content is now reliably updated on each interaction.
*   **Camera Controls**: Confirmed that camera orbit controls are consistently available and functional in the modal viewer, even with repeated opening and closing or model changes.
*   **Piping Utilities Consolidation**: Consolidated common piping server utilities into a shared `js/piping-utils.js` module, reducing code duplication in `js/qr-deploy.js` and `view/mobile_view.js`.

## Current Folder Structure

```ascii
.
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── piping-utils.js
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
│   ├── mobile-view.css
│   └── mobile_view.js
├── index.html
├── LICENSE
└── README.md
```

## TODO

-   **Refactor Mobile View Page (`view/index.html`)**:
    -   [X] Replace the embedded JavaScript in `view/index.html` with a script tag linking to the external `view/mobile_view.js`. *(Done)*
    -   [X] Move inline CSS from `view/index.html` to a dedicated external CSS file (`view/mobile-view.css`). *(Done)*
-   **Consolidate Piping Server Utilities**:
    -   [X] Create a shared JavaScript module (`js/piping-utils.js`).
    -   [X] Move common piping server constants and utility functions into this shared module.
    -   [X] Update `js/qr-deploy.js` and `view/mobile_view.js` to use this shared module.
-   **CSS Review**:
    -   [ ] Conduct a thorough review of all CSS (`css/styles.css` and `view/mobile-view.css`) to identify and remove any remaining redundancies or style overlaps.
-   **Testing**:
    -   [ ] Perform comprehensive cross-browser and cross-device testing of all application features.
-   **Documentation**:
    -   [ ] Add more detailed comments within the JavaScript files explaining complex sections.
    -   [ ] Expand `README.md` with setup instructions, explanation of features, and contribution guidelines if applicable.