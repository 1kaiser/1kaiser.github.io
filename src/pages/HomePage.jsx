import { createSignal } from 'solid-js';
import { Link } from '@solidjs/router';
import ModelViewer from '../components/ModelViewer';
import { models } from '../data/modelData';

const HomePage = () => {
  return (
    <>
      <h2>Explore 3D Models</h2>
      <div class="models-grid">
        {models.map((model) => (
          <div class="model-card">
            <ModelViewer
              modelSrc={model.src}
              alt={model.title}
              autoRotate={model.autoRotate}
              shadowIntensity={model.shadowIntensity}
            />
            <div class="model-info">
              <h3 class="model-title">{model.title}</h3>
              <p class="model-description">{model.description}</p>
              <Link href={`/model/${model.id}`}>View details</Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default HomePage;
