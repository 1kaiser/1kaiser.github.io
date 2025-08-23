'use strict';

function ModelCard({ model, style }) {
    // The style prop will be used to position and rotate the card
    return (
        <div className="model-card" style={style}>
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

function Gallery() {
    // Check if model data is available
    if (!window.modelsConfig || window.modelsConfig.length === 0) {
        return <p>Loading models...</p>;
    }

    const cards = window.modelsConfig.map((model, i) => {
        const numCards = window.modelsConfig.length;
        const random_rotate_z = (Math.random() * 10) - 5; // -5 to 5 degrees for a subtle effect
        const spread = 150; // How far apart the cards are
        const offset = (i - (numCards - 1) / 2) * spread;

        const style = {
            transform: `translateX(${offset}px) rotateZ(${random_rotate_z}deg)`,
            zIndex: i,
        };

        return <ModelCard key={i} model={model} style={style} />;
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
            <h1>React Test Page (All Tiles)</h1>
            <Gallery />
        </>
    );
};

const domContainer = document.querySelector('#root');
const root = ReactDOM.createRoot(domContainer);
root.render(<App />);
