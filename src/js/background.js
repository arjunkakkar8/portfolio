import * as THREE from "three";

let container;
let camera, scene, renderer;
let uniforms;
const glsl = (x) => x[0];

init();
animate();

function init() {
  container = document.body;

  camera = new THREE.Camera();
  camera.position.z = 1;

  scene = new THREE.Scene();

  let geometry = new THREE.PlaneBufferGeometry(2, 2);

  uniforms = {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    u_mouse: { type: "v2", value: new THREE.Vector2() },
  };

  let material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader(),
    fragmentShader: fragmentShader(),
  });
  material.transparent = true;

  let mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);

  container.appendChild(renderer.domElement);

  onWindowResize();
  window.addEventListener("resize", onWindowResize, false);
  document.onmousemove = function (e) {
    uniforms.u_mouse.value.x = e.pageX * window.devicePixelRatio;
    uniforms.u_mouse.value.y = e.pageY * window.devicePixelRatio;
  };
}

function onWindowResize(event) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  uniforms.u_time.value += 0.05;
  renderer.render(scene, camera);
}

function vertexShader() {
  return glsl`
    void main() {
        gl_Position = vec4( position, 1.0 );
    }`;
}

function fragmentShader() {
  return glsl`
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;

    float openerFilter(vec2 pos, float duration){
        if( u_time > duration ) {return 1.0;}
        float slitSizeY = 0.2 * pow(max(u_time-2.5, 0.0), 5.0) / duration;
        float slitSizeX = 0.1 * pow(max(u_time-1.0, 0.0), 5.0) / duration;
        float yFilter = smoothstep(0.5-slitSizeY, 0.5, pos.y)-smoothstep(0.5, 0.5+slitSizeY, pos.y);
        float xFilter = smoothstep(0.5-slitSizeX, 0.5, pos.x)-smoothstep(0.5, 0.5+slitSizeX, pos.x);
        float alpha = xFilter * yFilter;
        return alpha;
    }
    vec4 baseColor(vec2 pos){
        return vec4(0.3 * pos.x * abs(sin(u_time/4.0)), pos.y * 0.5 * abs(sin(u_time/20.0)), 0.3, 0.8);
    }

    vec4 mouseColor(vec2 pos, vec2 mouse){
        vec4 base = baseColor(pos);
        float adj = 0.0;
        if(mouse.x > 0.8){
            adj+= (mouse.x-0.8) * smoothstep(0.8, 1.0, pos.x);
        }
        if(mouse.x < 0.2){
            adj+= (0.2-mouse.x) * smoothstep(0.2, 0.0, pos.x);
        }
        if(mouse.y > 0.8){
            adj+= (mouse.y-0.8) * smoothstep(0.2, 0.0, pos.y);
        }
        if(mouse.y < 0.2){
            adj+= (0.2-mouse.y) * smoothstep(0.8, 1.0, pos.y);
        }
        adj = min(adj, 2.0);
        base.w += adj;
        return base;
    }

    void main() {
        vec2 st = gl_FragCoord.xy/u_resolution.xy;
        vec2 sm = u_mouse.xy/u_resolution.xy;
        gl_FragColor = openerFilter(st, 5.0) * mouseColor(st, sm);
    }`;
}

//*vec4(st.x*sm.x*abs(sin(u_time/2.0)),0.5*st.y*sm.y*abs(sin(u_time/3.0)),0.3*abs(sin(u_time/4.0)),1.0);
