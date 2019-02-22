#ifndef __EVENT_H_
#define __EVENT_H_

namespace Eden {

class Event {
public:

  enum EventT {
    Move,
    Discover,
    Use,
    Attack,
    Defend,
    Cast,
    Heal,
    Damage,
    Kill,
    Die,
    Win,
    Lose,
  };

  Event(Entity *Ent, EventT Ty) : TheEntity(Ent) : EvTy(Ty) { }

private:
  Entity *TheEntity = nullptr;
  EventT EvTy;
};

} // end namespace Eden

#endif
