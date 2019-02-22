#ifndef __OBSERVER_H_
#define __OBSERVER_H_

namespace Eden {

class Event;

class Observer {
public:
  virtual ~Observer();
  virtual void Notify(Event *E);
};

} // end namespace Eden

#endif
