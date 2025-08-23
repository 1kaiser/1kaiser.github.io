'use strict';

// Use React's state hook to manage interactivity
const { useState } = React;

function ModelCard({ model, style, onMouseEnter, onMouseLeave }) {
    const modelUrl = model.url.startsWith('http') ? model.url : `../${model.url}`;
    const posterUrl = model.poster.startsWith('http') ? model.poster : `../${model.poster}`;

    // The style prop will be used to position and rotate the card
    return (
        <div
            className="model-card"
            style={style}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <model-viewer
                src={modelUrl}
                poster={posterUrl}
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

function Gallery() {
    const [activeIndex, setActiveIndex] = useState(null);

    // Check if model data is available
    if (!window.modelsConfig || window.modelsConfig.length === 0) {
        return <p>Loading models...</p>;
    }

    const cards = window.modelsConfig.map((model, i) => {
        const numCards = window.modelsConfig.length;
        const isHovered = activeIndex === i;

        // Base layout calculations
        const random_rotate_z = (model.initialRotation = model.initialRotation || (Math.random() * 10) - 5);
        const spread = 150;
        const offset = (i - (numCards - 1) / 2) * spread;

        // Base transform
        let transform = `translate(-50%, -50%) translateX(${offset}px) rotateZ(${random_rotate_z}deg)`;

        // Modify transform on hover
        if (isHovered) {
            transform = `translate(-50%, -50%) translateX(${offset}px) rotateZ(0deg) scale(1.1)`;
        }

        const style = {
            transform: transform,
            zIndex: isHovered ? 100 : i,
        };

        return (
            <ModelCard
                key={i}
                model={model}
                style={style}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
            />
        );
    });

    return (
        <div className="gallery-container">
            {cards}
        </div>
    );
}

const App = () => {
    return (
        <>
            <h1>React Test Page (Interactive)</h1>
            <Gallery />
        </>
    );
};

const domContainer = document.querySelector('#root');
const root = ReactDOM.createRoot(domContainer);
root.render(<App />);
