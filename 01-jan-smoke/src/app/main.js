// @flow

import * as THREE from 'three';
import glslify from 'glslify';

const smokeVert = glslify('../shaders/smoke.vert');
const smokeFrag = glslify('../shaders/smoke.frag');

let renderer;
let scene;
let camera;

let texMat;
let texTarget, texTarget2;
let drawFrameA: boolean;

let clock;

export async function main() {
  setup();

  window.addEventListener( 'resize', onWindowResize, false );
  function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    texTarget.setSize(window.innerWidth, window.innerHeight);
    texTarget2.setSize(window.innerWidth, window.innerHeight);

    texMat.uniforms.resolution.value.set(window.innerWidth, window.innerHeight, 0);
    texMat.uniforms.resolution.needsUpdate = true;
    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  clock = new THREE.Clock();
  render();
}

async function setup(): Promise<void> {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer = new THREE.WebGLRenderer();
  renderer.setSize( width, height );
  document.body.appendChild( renderer.domElement );
  scene = new THREE.Scene();

  drawFrameA = true;
  texTarget = new THREE.WebGLRenderTarget( width, height, {
    stencilBuffer: false,
    depthBuffer: false
  });
  texTarget2 = texTarget.clone();


  texMat = new THREE.ShaderMaterial({
    uniforms: {
      lastTex: { type: 't', value: texTarget.texture },
      resolution: { type: 'v3', value: new THREE.Vector3(width, height, 0) },
      globalTime: { type: 'f', value: 100.0 }
    },
    vertexShader: smokeVert,
    fragmentShader: smokeFrag
  });
  camera = new THREE.OrthographicCamera(
    -width / 2,
    width / 2,
    height / 2,
    -height / 2,
    -1000, 1000
  );

  const texGeo = new THREE.PlaneGeometry( width, height );
  const texMesh = new THREE.Mesh( texGeo, texMat );
  texMesh.position.z = -100;
  scene.add( texMesh );
}

function update() {
  let drawTarget;
  if (drawFrameA) {
    texMat.uniforms.lastTex.value = texTarget.texture;
    drawTarget = texTarget2;
    drawFrameA = false;
  } else {
    texMat.uniforms.lastTex.value = texTarget2.texture;
    drawTarget = texTarget;
    drawFrameA = true;
  }
  texMat.uniforms.lastTex.needsUpdate = true;

  texMat.uniforms.globalTime.value += clock.getDelta();
  texMat.uniforms.globalTime.needsUpdate = true;

  renderer.render( scene, camera, drawTarget, true );
}

function render() {
	requestAnimationFrame( render );
  update();
  renderer.render( scene, camera );
}
