#ifndef __OBSERVER_H_
#define __OBSERVER_H_

namespace greenman {

class Event;

class Observer {
public:
  virtual ~Observer();
  virtual void Notify(Event *E);
};

} // end namespace greenman

#endif
