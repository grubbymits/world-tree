![example workflow](https://github.com/grubbymits/world-tree/actions/workflows/node.js.yml/badge.svg?branch=main)

<img src="https://raw.githubusercontent.com/grubbymits/world-tree/main/logo.svg" width=40% align=right>

World Tree is a library to help create interactable worlds for the web. The main
goal is to produce a framework to make games that is easy to use. This is
achieved by providing a low barrier to entry for game development:

- A map can be generated by providing a single tile sprite, along with a 2D
  array of numbers which represent the heights of the map locations. This kind
  of simple map would be sufficient for a basic dungen crawler or tower defense
  game.
- Other terrains, along with water, can easily be added by simply providing some
  extra sprites.
- A user of the engine will likely want to add player- and computer-controlled
  characters into the world.
- Mouse click and character tracking camera. 
- The engine has been developed using isometric sprites, but has been designed
  for so that other perspectives can easily be plugged in by implementing a
  SceneGraph object. This just needs to provide method implementations to
  convert 3D world coordinates into 2D for the screen, as well as providing an
  ordering for each entity to be drawn.
- An octree is implemented for spatial locality and all movements of Actors are
  automatically updated in the tree and can be easily queried.
- A light-weight event system is employed to keep the engine, characters and
  player informed of the changing environment.
- WebWorker rendering support.
