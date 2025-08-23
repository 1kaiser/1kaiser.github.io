'use strict';

const { useState, useEffect } = React;

function ModelCard({ model, style, onMouseEnter, onMouseLeave }) {
    const [edgeColor, setEdgeColor] = useState(null);

    useEffect(() => {
        const colorThief = new ColorThief();
        const img = new Image();

        // The posterUrl needs to be constructed correctly, including the `../`
        const posterUrl = model.poster.startsWith('http') ? model.poster : `../${model.poster}`;

        img.crossOrigin = 'Anonymous'; // Needed for cross-origin images
        img.src = posterUrl;

        img.onload = () => {
            const dominantColor = colorThief.getColor(img);
            // Set a semi-transparent color for the glow effect
            setEdgeColor(`rgba(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]}, 0.8)`);
        };
    }, [model.poster]);

    // Combine the layout style with the dynamic edge color style
    const combinedStyle = {
        ...style,
        boxShadow: edgeColor ? `0 0 20px 5px ${edgeColor}` : '0 10px 30px rgba(0, 0, 0, 0.15)',
    };

    const modelUrl = model.url.startsWith('http') ? model.url : `../${model.url}`;

    return (
        <div
            className="model-card"
            style={combinedStyle}
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

    if (!window.modelsConfig || window.modelsConfig.length === 0) {
        return <p>Loading models...</p>;
    }

    const cards = window.modelsConfig.map((model, i) => {
        const numCards = window.modelsConfig.length;
        const isHovered = activeIndex === i;

        const random_rotate_z = (model.initialRotation = model.initialRotation || (Math.random() * 10) - 5);
        const spread = 150;
        const offset = (i - (numCards - 1) / 2) * spread;

        let transform = `translate(-50%, -50%) translateX(${offset}px) rotateZ(${random_rotate_z}deg)`;

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
            <h1>React Test Page (Edge Effect)</h1>
            <Gallery />
        </>
    );
};

const domContainer = document.querySelector('#root');
const root = ReactDOM.createRoot(domContainer);
root.render(<App />);
