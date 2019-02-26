#ifndef __RENDERER_H_
#define __RENDERER_H_

namespace greenman {

class Renderer {
public:
  virtual Renderer();
  virtual ~Renderer();
  virtual void UpdateViewPort() = 0;
  virtual void RenderSprite() = 0;
  virtual void Clear() = 0;
  virtual void Reset() = 0;
};

} // end namespace greenman

#endif
