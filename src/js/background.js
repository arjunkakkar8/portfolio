import * as THREE from "three";

let container;
let camera, scene, renderer;
let uniforms;
const glsl = (x) => x[0];

init();
animate();

function init() {
  THREE.Cache.enabled = true;

  container = document.body;

  camera = new THREE.Camera();
  camera.position.z = 1;

  scene = new THREE.Scene();

  let geometry = new THREE.PlaneBufferGeometry(2, 2);

  uniforms = {
    u_time: { type: "f", value: 1.0 },
    u_resolution: { type: "v2", value: new THREE.Vector2() },
    u_mouse: { type: "v2", value: new THREE.Vector2(0.5, 0.5) },
    tex_next: { type: "t", value: new THREE.TextureLoader().load(d3.select(".project-container").node().dataset.img) },
    tex_curr: { type: "t", value: new THREE.TextureLoader().load(d3.select(".project-container").node().dataset.img) },
    tex_curr_ratio: { type: "f", value: 1.2 },
    tex_next_ratio: { type: "f", value: 1.2 },
    transitionProgress: { type: "f", value: 1.0 },
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

  if (screen.width > 800) {
    addPointerListener();
  }
}

// function addOrientationListener() {
//   window.addEventListener("deviceorientation", handleOrientation, true);
//   function handleOrientation(e) {
//     uniforms.u_mouse.value.x = 0.5 + e.beta / 360;
//     uniforms.u_mouse.value.y = 0.5 + e.beta / 360;
//   }
// }

function addPointerListener() {
  window.addEventListener("pointermove", handlePointer, true);
  function handlePointer(e) {
    uniforms.u_mouse.value.x = e.pageX / window.innerWidth;
    uniforms.u_mouse.value.y = 1 - e.pageY / window.innerHeight;
  }
}

function onWindowResize(event) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;
}

function animate() {
  render();
  requestAnimationFrame(animate);
}

function render() {
  uniforms.u_time.value += 0.05;
  if (uniforms.transitionProgress.value < 1) {
    uniforms.transitionProgress.value += 0.025;
  }
  if (screen.width < 800) {
    uniforms.u_mouse.value.x = (Math.sin(uniforms.u_time.value / 2) + 1) / 2;
    uniforms.u_mouse.value.y = (Math.cos(uniforms.u_time.value / 3) + 1) / 2;
  }
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
    uniform float tex_curr_ratio;
    uniform float tex_next_ratio;
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform sampler2D tex_curr;
    uniform sampler2D tex_next;
    uniform float transitionProgress;

    #define tPI 6.283185

    float horizontalHexagons = 40.*u_resolution.x/u_resolution.y;
    float openTransitionDuration = 5.0;
    float openDuration = 20.0;

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

    vec2 samplerCoords(vec2 pos, float texRatio){
      float x = 0.0;
      float y = 0.0;
      float dispRatio = u_resolution.x/u_resolution.y;
      if(dispRatio < texRatio){
        x = 0.5 + (pos.x-0.5) * (dispRatio / texRatio);
        y = pos.y;
      } else{
        x = pos.x;
        y = 0.5 + (pos.y-0.5) * (texRatio / dispRatio);
      }
      return vec2(x, y);
    }

    vec4 abberation(vec2 pos, float dist, sampler2D texture, float texRatio){
      vec2 offset = vec2(dist*0.005,dist*0.005);
      vec4 col = vec4(0.,0.,0.,1.);
      col.r = texture2D(texture, samplerCoords(pos+offset.xy, texRatio)).r;
		  col.g = texture2D(texture, samplerCoords(pos, texRatio)).g;
      col.b = texture2D(texture, samplerCoords(pos+offset.yx, texRatio)).b;
      return col;
    }

    vec4 blur(vec2 pos, float dist, sampler2D texture, float texRatio){
      #define Directions 4.0
      #define Quality 2.0
      float Size = dist * 10.0;
      vec2 Radius = Size/u_resolution.xy;
      vec4 color = abberation(pos, dist, texture, texRatio);

      // Blur calculations
      for( float d=0.0; d<tPI; d+=tPI/Directions){
        for(float i=1.0/Quality; i<=1.0; i+=1.0/Quality){
          color += abberation(pos+vec2(cos(d),sin(d))*Radius*i, dist, texture, texRatio);		
        }
      }

      color /= Quality * Directions + 4.;
      return color;
    }

    float distMod(vec2 pos){
      float xComp = 0.0;
      float yComp = 0.0;
      if(u_resolution.x > u_resolution.y){
        xComp = pow(u_resolution.x*(pos.x - u_mouse.x)/u_resolution.y, 2.0);
        yComp = pow(pos.y - u_mouse.y, 2.0);
      } else{
        xComp = pow(pos.x - u_mouse.x, 2.0);
        yComp = pow(u_resolution.y*(pos.y - u_mouse.y)/u_resolution.x, 2.0);
      }
      return pow(xComp*(1.+0.2*sin(2.*u_time))+yComp*(1.+0.2*cos(3.*u_time)), 0.5);
    }

    struct Hexagon {
      float q;
      float r;
      float s;
    };

    Hexagon createHexagon(float q, float r){
      Hexagon hex;
      hex.q = q;
      hex.r = r;
      hex.s = -q - r;
      return hex;
    }

    Hexagon roundHexagon(Hexagon hex){
      
      float q = floor(hex.q + 0.5);
      float r = floor(hex.r + 0.5);
      float s = floor(hex.s + 0.5);

      float deltaQ = abs(q - hex.q);
      float deltaR = abs(r - hex.r);
      float deltaS = abs(s - hex.s);

      if (deltaQ > deltaR && deltaQ > deltaS)
        q = -r - s;
      else if (deltaR > deltaS)
        r = -q - s;
      else
        s = -q - r;

      return createHexagon(q, r);
    }

    Hexagon hexagonFromPoint(vec2 point, float size) {
      
      point.y /= u_resolution.x/u_resolution.y;
      point = (point - 0.5) / size;
      
      float q = (sqrt(3.0) / 3.0) * point.x + (-1.0 / 3.0) * point.y;
      float r = 0.0 * point.x + 2.0 / 3.0 * point.y;

      Hexagon hex = createHexagon(q, r);
      return roundHexagon(hex);
    }

    vec2 pointFromHexagon(Hexagon hex, float size) {
      
      float x = (sqrt(3.0) * hex.q + (sqrt(3.0) / 2.0) * hex.r) * size + 0.5;
      float y = (0.0 * hex.q + (3.0 / 2.0) * hex.r) * size + 0.5;
      
      return vec2(x, y * u_resolution.x/u_resolution.y);
    }

    float calcBoundaryBoxDist(float size, vec2 point){
      float yDist = abs(size - point.y);
      float xDist = abs(size*sqrt(3.) * 0.5 - point.x);
      return min(xDist, yDist);
    }

    vec2 rotatePoint(float deg, vec2 point){
      point.y /= u_resolution.x/u_resolution.y;
      return vec2(point.x * cos(deg * tPI / 180.) - point.y * sin(deg * tPI / 180.), point.y * cos(deg * tPI / 180.) + point.x * sin(deg * tPI / 180.));
    }

    float calcHexBoundDist(float size, vec2 point){
      float dist = min(calcBoundaryBoxDist(size, rotatePoint(0., point)), calcBoundaryBoxDist(size, rotatePoint(60., point)));
      dist = min(dist, calcBoundaryBoxDist(size, rotatePoint(120., point)));
      dist = min(dist, calcBoundaryBoxDist(size, rotatePoint(180., point)));
      dist = min(dist, calcBoundaryBoxDist(size, rotatePoint(240., point)));
      dist = min(dist, calcBoundaryBoxDist(size, rotatePoint(300., point)));
      dist = min(dist, calcBoundaryBoxDist(size, rotatePoint(360., point)));
      return dist/size;
    }

    vec4 textureTransition(vec2 pos, float dist, float progress){
      if(progress < 1.0){
        float size = (sqrt(3.0) / 3.0) / horizontalHexagons;
        vec2 point = pointFromHexagon(hexagonFromPoint(pos, size), size);
        float hexOutline = max(0.1, smoothstep(0., 0.2, calcHexBoundDist(size, pos-point)));

        if(progress < 0.25){
          float segProgress = progress/0.25;
          if(segProgress < length(u_mouse-point)){
            hexOutline = 1.;
          }
          return mix(blur(pos, dist, tex_curr, tex_curr_ratio), blur(point, dist, tex_curr, tex_curr_ratio)*hexOutline, segProgress);
        } else if (progress < 0.5){
          float segProgress = (progress-0.25)/0.25;
          return mix(blur(point, dist, tex_curr, tex_curr_ratio)*hexOutline, blur(point, dist, tex_next, tex_next_ratio)*hexOutline, segProgress);
        } else if (progress < 0.75){
          float segProgress = (progress-0.5)/0.25;
          return mix(blur(point, dist, tex_next, tex_next_ratio)*hexOutline, blur(point, dist, tex_next, tex_next_ratio), segProgress);
        } else {
          float segProgress = (progress-0.75)/0.25;
          return mix(blur(point, dist, tex_next, tex_next_ratio), blur(pos, dist, tex_next, tex_next_ratio), segProgress);
        }
      }else{
        return blur(pos, dist, tex_next, tex_next_ratio);
      }
    }

    vec4 colorSetter(vec2 pos){
      vec4 outColor = vec4(0.0,0.0,0.0,1.0);
      if(u_time < openDuration){
        outColor = baseColor(pos) * openerFilter(pos, openTransitionDuration);
      } else{
        float dist = 1./(1.+exp((0.5-2.0*distMod(pos))*5.0));
        outColor = mix(textureTransition(pos, dist, transitionProgress), baseColor(pos), dist);
      }
      return outColor;
    }

    void main() {
        vec2 st = gl_FragCoord.xy/u_resolution.xy;
        gl_FragColor = colorSetter(st);
    }`;
}

export { uniforms };
