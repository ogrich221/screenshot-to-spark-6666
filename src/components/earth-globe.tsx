import { useEffect, useRef } from 'react';
import earthSurface from '@/assets/earth-surface.jpg.asset.json';

type Country = { name: string; lat: number; lng: number };

export function EarthGlobe({ countries }: { countries: Country[] }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void import('three').then((THREE) => {
      if (disposed) return;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.z = 3.8;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(200, 200);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);
      const globe = new THREE.Group();
      globe.rotation.y = -Math.PI / 2;
      scene.add(globe);
      const texture = new THREE.TextureLoader().load(earthSurface.url);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const geometry = new THREE.SphereGeometry(1, 64, 48);
      const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 });
      globe.add(new THREE.Mesh(geometry, material));
      scene.add(new THREE.AmbientLight(0xffffff, 2.1));
      const sunlight = new THREE.DirectionalLight(0xffffff, 2.5);
      sunlight.position.set(-3, 4, 5);
      scene.add(sunlight);
      const markerColor = getComputedStyle(container).getPropertyValue('--primary').trim();
      const colorProbe = document.createElement('span');
      colorProbe.style.color = markerColor;
      container.appendChild(colorProbe);
      const resolved = getComputedStyle(colorProbe).color;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d');
      let markerColorValue = new THREE.Color();
      if (context) {
        context.fillStyle = resolved;
        context.fillRect(0, 0, 1, 1);
        const [r = 255, g = 215, b = 0] = context.getImageData(0, 0, 1, 1).data;
        markerColorValue = new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
      }
      colorProbe.remove();
      const markerGeometry = new THREE.SphereGeometry(0.018, 12, 12);
      const markerMaterial = new THREE.MeshBasicMaterial({ color: markerColorValue });
      countries.forEach(({ lat, lng }) => {
        const latitude = THREE.MathUtils.degToRad(lat);
        const longitude = THREE.MathUtils.degToRad(lng);
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(1.015 * Math.cos(latitude) * Math.cos(longitude), 1.015 * Math.sin(latitude), -1.015 * Math.cos(latitude) * Math.sin(longitude));
        globe.add(marker);
      });
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      let previousTime = 0;
      let dragging = false;
      let previousX = 0;
      const down = (event: PointerEvent) => { dragging = true; previousX = event.clientX; renderer.domElement.setPointerCapture(event.pointerId); };
      const move = (event: PointerEvent) => {
        if (!dragging) return;
        globe.rotation.y += (event.clientX - previousX) * 0.012;
        previousX = event.clientX;
      };
      const up = () => { dragging = false; };
      renderer.domElement.addEventListener('pointerdown', down);
      renderer.domElement.addEventListener('pointermove', move);
      renderer.domElement.addEventListener('pointerup', up);
      renderer.domElement.addEventListener('pointercancel', up);
      renderer.setAnimationLoop((time) => {
        const delta = previousTime ? Math.min((time - previousTime) / 1000, 0.1) : 0;
        previousTime = time;
        if (!reducedMotion.matches && !dragging) globe.rotation.y += delta * Math.PI * 2 / 35;
        renderer.render(scene, camera);
      });
      cleanup = () => {
        renderer.setAnimationLoop(null);
        renderer.domElement.removeEventListener('pointerdown', down);
        renderer.domElement.removeEventListener('pointermove', move);
        renderer.domElement.removeEventListener('pointerup', up);
        renderer.domElement.removeEventListener('pointercancel', up);
        geometry.dispose(); material.dispose(); texture.dispose();
        markerGeometry.dispose(); markerMaterial.dispose(); renderer.dispose();
        renderer.domElement.remove();
      };
    });
    return () => { disposed = true; cleanup?.(); };
  }, [countries]);

  return <div ref={host} className="earth-globe shrink-0" role="img" aria-label="Spinning globe highlighting the 12 countries Lumen Bank operates from" />;
}