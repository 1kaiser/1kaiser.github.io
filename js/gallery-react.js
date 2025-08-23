'use strict';

const { useState, useEffect } = React;

function ModelCard({ model, style, onMouseEnter, onMouseLeave }) {
    const [edgeColor, setEdgeColor] = useState(null);

    useEffect(() => {
        const colorThief = new ColorThief();
        const img = new Image();

        // Paths are now relative to the root index.html
        const posterUrl = model.poster.startsWith('http') ? model.poster : model.poster;

        img.crossOrigin = 'Anonymous';
        img.src = posterUrl;

        img.onload = () => {
            const dominantColor = colorThief.getColor(img);
            setEdgeColor(`rgba(${dominantColor[0]}, ${dominantColor[1]}, ${dominantColor[2]}, 0.8)`);
        };
    }, [model.poster]);

    const combinedStyle = {
        ...style,
        boxShadow: edgeColor ? `0 0 20px 5px ${edgeColor}` : '0 10px 30px rgba(0, 0, 0, 0.15)',
    };

    const modelUrl = model.url.startsWith('http') ? model.url : model.url;

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
        const translateY = Math.abs(i - (numCards - 1) / 2) * -30 + 50; // Arc effect

        let transform = `translate(-50%, -50%) translateX(${offset}px) translateY(${translateY}px) rotateZ(${random_rotate_z}deg)`;

        if (isHovered) {
            transform = `translate(-50%, -50%) translateX(${offset}px) translateY(${translateY - 20}px) rotateZ(0deg) scale(1.1)`;
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

// This is the main App component for the gallery
const GalleryApp = () => {
    return (
        <Gallery />
    );
};

const domContainer = document.querySelector('#gallery-root');
const root = ReactDOM.createRoot(domContainer);
root.render(<GalleryApp />);
