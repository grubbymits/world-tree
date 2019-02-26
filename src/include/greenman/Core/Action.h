#ifndef __ACTION_H_
#define __ACTION_H_

namespace greenman {

class Action {
  Actor &Performer;

public:
  Action(Actor &Performer) : Performer(Performer) { }
  Action() = delete;
  virtual ~Action();
  virtual void operator()() = 0;
};

} // end namespace greenman

#endif
