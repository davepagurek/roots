const ns = 'http://www.w3.org/2000/svg';

const rand = (a, b) => Math.random()*(b-a) + a;

const Tree = (w, h) => {
  const resolution = 5;
  
  const tree = {
    elements: [],
    spawnPoints: [],
    
    start: () => {
      const initial = [w*0.5, h*0.75, 0, 1];
      const initialR = 30;
      
      tree.spawnPoints.push({
        at: initial,
        dir: [0, -1, 0, 0],
        r: initialR,
        scale: [0.9, 1.05],
        children: [1, 0.01, 0.005]
      });
      
      const numRoots = Math.round(rand(3, 6));
      for (let i = 0; i < numRoots; i++) {
        const dir = [0, 1, 0, 0];
        vec4.transformMat4(
          dir,
          dir,
          mat4.fromRotation(
            [], rand(Math.PI*0.2, Math.PI*0.5), [0, 0, 1]));
        vec4.transformMat4(
          dir,
          dir,
          mat4.fromRotation(
            [], rand(0, Math.PI*2), [0, 1, 0]));
        
        tree.spawnPoints.push({
          at: initial,
          dir,
          r: initialR,
          scale: [0.7, 1.01],
          children: [1, 0.005, 0.005]
        });
      }
      
      return tree;
    },

    add: element => tree.elements.push(element),
    
    extend: spawnPoint => {
      const [x, y, z, _] = spawnPoint.at;
      
      if (spawnPoint.r < 0.1) return;
      
      tree.add({ x, y, z, r: spawnPoint.r });
      
      spawnPoint.children.forEach(probability => {
        if (rand(0,1) > probability) return;
        
        const normal = [
          ...vec3.cross(
            [],
            spawnPoint.dir,
            vec3.normalize([], [rand(-1,1), rand(-1,1), rand(-1,1)])),
          0
        ];

        const nextLoc = vec4.add(
          [],
          spawnPoint.at,
          vec4.scale([], spawnPoint.dir, resolution));

        const nextDir = vec4.transformMat4(
          [],
          spawnPoint.dir,
          mat4.fromRotation([], rand(0, Math.PI*0.2), normal));
        vec4.transformMat4(
          nextDir,
          nextDir,
          mat4.fromRotation([], rand(0, Math.PI*0.2), spawnPoint.dir));

        const nextR = spawnPoint.r * rand(...spawnPoint.scale);

        tree.spawnPoints.push({
          at: nextLoc,
          dir: nextDir,
          r: nextR,
          scale: spawnPoint.scale,
          children: spawnPoint.children
        });
      });
    },
    
    grow: () => {
      const queue = tree.spawnPoints;
      tree.spawnPoints = [];
      
      queue.forEach(point => tree.extend(point));
      
      return tree;
    },
    
    growAll: () => {
      while (tree.spawnPoints.length > 0) {
        tree.grow();
      }
      
      return tree;
    },
    
    renderElement: element => {
      const circle = document.createElementNS(ns, 'ellipse');
      circle.setAttribute('cx', element.x);
      circle.setAttribute('cy', element.y);
      circle.setAttribute('rx', element.r);
      circle.setAttribute('ry', element.r);
      circle.setAttribute('fill', '#FFF');
      circle.setAttribute('stroke', '#000');
      circle.setAttribute('stroke-width', 1);
      
      return circle;
    },

    rendered: () => {
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('width', w);
      svg.setAttribute('height', h);
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      
      tree.elements
        .sort((a, b) => a.z - b.z) // Painter's algorithm
        .forEach(element =>
          svg.appendChild(tree.renderElement(element)));
      
      return svg;
    }
  };
  
  return tree;
};

const generate = () => {
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }

  document.body.appendChild(Tree(800, 600).start().growAll().rendered());
};

generate();

document.addEventListener('click', generate);