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

*   <a href="https://vuejs.org/" target="_blank" rel="noopener noreferrer"><img src="https://vuejs.org/images/logo.png" alt="Vue.js Logo" title="Vue.js" width="40"></a>
    **[Vue.js](https://vuejs.org/)**: The Progressive JavaScript Framework used for building the user interface of the gallery.

*   <a href="https://cdnjs.com/" target="_blank" rel="noopener noreferrer"><img src="https://raw.githubusercontent.com/cdnjs/brand/master/logo/standard/dark-1024.png" alt="cdnjs Logo" title="cdnjs" width="40"></a>
    **[cdnjs](https://cdnjs.com/)**: A free and open-source CDN used for hosting some of the project's dependencies.

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
*   **AI/ML Experiments Page**: A page listing various browser-based AI/ML experiments and visualizations.

## 🚀 AI/ML Experiments

This repository also includes a page dedicated to various AI/ML experiments, which can be found at [`experiments.html`](experiments.html). These experiments showcase browser-based AI applications and visualizations.

### 🌟 Featured Experiments
*   **Wordy**: [Live Demo](https://1kaiser.github.io/wordy/) | [GitHub](https://github.com/1kaiser/wordy)
*   **TextGraph**: [Live Demo](https://1kaiser.github.io/TextGraph/) | [GitHub](https://github.com/1kaiser/TextGraph)
*   **Gemma Chat App**: [Live Demo](https://1kaiser.github.io/gemma-chat-app/) | [GitHub](https://github.com/1kaiser/gemma-chat-app)
*   **LLM Consistency Vis**: [Live Demo](https://1kaiser.github.io/llm-consistency-vis/) | [GitHub](https://github.com/1kaiser/llm-consistency-vis)

### 📚 Other Experiments
*   **LLM WordGraph Exact**: [Live Demo](https://1kaiser.github.io/llm-wordgraph-exact/) | [GitHub](https://github.com/1kaiser/llm-wordgraph-exact)

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
│   ├── gallery-vue.js
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

## Interaction GIF

This GIF demonstrates the key interactions of the 3D Model Gallery, such as scrolling, selecting a model, and viewing it in the modal window.

![Interaction GIF](interaction.gif)

### Creating the GIF

The GIF was created using the following process:

1.  **Record Interaction**: A screen recording of the website's interaction was captured using Playwright and Node.js.
2.  **Convert to GIF**: The video was then converted into a GIF, with optimizations for file size and quality.
