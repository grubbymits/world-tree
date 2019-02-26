// Provides a unified place for the system to communicate. This is performed by
// posting Events that maybe of interest to other subsystems. These subsystems
// register themselves by being added as an Observer.

#ifndef __ENGINE_H_
#define __ENGINE_H_

namespace greenman {

class Event;
class Observer;

class Engine {
  std::list<unique_ptr<Event>> Events;

public:
  Engine();
  void addEvent(Event *E);
  void addObserver(Observer *O);
};

} // end namespace greenman

#endif
