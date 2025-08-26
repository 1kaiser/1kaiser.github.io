# 1kaiser.github.io

This repository hosts a 3D Model Gallery web application.

## Acknowledgements

This project leverages several key technologies and AI assistance:

*   <a href="https://developers.google.com/community/jules" target="_blank" rel="noopener noreferrer"><img src="https://github.com/google-labs-code/jules-awesome-list/blob/main/assets/jules-readme.png?raw=true" alt="Jules AI Logo" title="AI Development Assistance by Jules" width="40"></a>
    **AI Development Assistance**: Initial development, refactoring, feature implementation, and debugging significantly aided by Jules (a large language model from Google).

*   <a href="https://modelviewer.dev/" target="_blank" rel="noopener noreferrer"><img src="https://modelviewer.dev/assets/ic_modelviewer.svg" alt="Model Viewer Icon" title="Google <model-viewer>" width="40"></a>
    **[Google `<model-viewer>`](https://modelviewer.dev/)**: For rendering 3D models interactively on the web and enabling AR experiences. *(Note: SVG logo, display size may still vary slightly even with width attribute in some viewers.)*

*   <a href="https://threejs.org/" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/mrdoob/three.js/dev/editor/images/icon.png" alt="Three.js Icon" title="Three.js" width="40"></a>
    **[Three.js](https://threejs.org/)**: The powerful WebGL library that `<model-viewer>` is built upon for 3D graphics rendering.

*   <a href="https://google.github.io/draco/" target="_blank" rel="noopener noreferrer"><img src="https://google.github.io/draco/artwork/draco3d-vert-360x274.png" alt="Draco 3D Logo" title="Google Draco" width="40"></a>
    **[Google Draco](https://google.github.io/draco/)**: For 3D graphics compression, helping reduce the size of the 3D models.

*   **[Piping Server](https://github.com/nwtgck/piping-server)**: Used to facilitate the real-time transfer of model data for the 'Deploy to Mobile' QR code feature. (Textual acknowledgement as no distinct project logo).

*   <a href="https://react.dev" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/reactjs/reactjs.org/main/src/icons/logo.svg" alt="React Logo" title="React" width="40"></a>
    **[React](https://react.dev)**: A JavaScript library for building user interfaces, used in the `react-test` experimental area.

*   <a href="https://babeljs.io/" target="_blank" rel="noopener noreferrer"><img src="https://icon.icepanel.io/Technology/svg/Babel.svg" alt="Babel Logo" title="Babel" width="40"></a>
    **[Babel](https://babeljs.io/)**: A JavaScript compiler used to transform modern JavaScript into backwards-compatible versions.

*   <a href="https://cdnjs.com/" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/cdnjs/brand/master/logo/standard/dark-1024.png" alt="cdnjs Logo" title="cdnjs" width="40"></a>
    **[cdnjs](https://cdnjs.com/)**: A free and open-source CDN used for hosting some of the project's dependencies.

*   **[Color Thief](https://lokeshdhakar.com/projects/color-thief/)**: A script for grabbing the dominant color or color palette from an image, used for dynamic color theming.

*   **[unpkg](https://unpkg.com/)**: A fast, global content delivery network for everything on npm, used for hosting some of the project's dependencies.

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
*   **CV Page**: A dedicated page to showcase a curriculum vitae.

## Recent Improvements

*   **CV Page**: Added a new CV page with placeholder content.
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
├── cv/
│   ├── cv.css
│   ├── cv.html
│   └── cv.js
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