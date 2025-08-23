'use strict';

// Since we don't have a module loader, we'll define the model data here for the test.
const modelData = {
    url: "../models/31_10_2024.glb",
    poster: "../models/31_10_2024.webp",
    title: "My Model",
    description: "React Component Test",
    alt: "A 3D model"
};

function ModelCard(props) {
    const { model } = props;

    // Note: In a real React app, we would use `React.useEffect` to handle
    // the model-viewer element imperatively, but for this simple test,
    // we can rely on its declarative attributes.
    // Also, model-viewer is a web component, so React treats it as a custom element.

    return (
        <div className="model-card">
            <model-viewer
                src={model.url}
                poster={model.poster}
                alt={model.alt}
                shadow-intensity="1"
                camera-controls
                auto-rotate
            >
            </model-viewer>
            <div className="model-info-overlay">
                <h2>{model.title}</h2>
                <p>{model.description}</p>
            </div>
        </div>
    );
}

const App = () => {
    return (
        <>
            <h1>React Test Page</h1>
            <ModelCard model={modelData} />
        </>
    );
};

const domContainer = document.querySelector('#root');
const root = ReactDOM.createRoot(domContainer);
root.render(<App />);
