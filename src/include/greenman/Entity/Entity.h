#ifndef __ENTITY_H_
#define __ENTITY_H_

namespace greenman {

class MNode;

class Entity {
  MNode *Loc = nullptr;
  Sprite *Img = nullptr;
  bool IsBlocking = true;
  bool IsInteractable = false;

public:
  Entity();
};

#endif
