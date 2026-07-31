import { ReactElement, cloneElement, isValidElement } from 'react';
import './ButtonAnimationWrapper.scss';

interface AnimationWrapperProps {
  children: ReactElement;
  shouldDisableAnimation?: boolean;
}

// This component adds button-animation className to its child element without adding extra DOM nodes
// Wrap clickable elements with this component to apply button animation styles on that specific element
const ButtonAnimationWrapper = ({
  children,
  shouldDisableAnimation = false,
}: AnimationWrapperProps) => {
  if (!isValidElement(children) || children.type === 'Fragment') {
    return children;
  }

  const mergedClassName = [
    (children.props as any).className,
    !shouldDisableAnimation && 'button-animation',
  ]
    .filter(Boolean)
    .join(' ');


  return cloneElement(children as any, {
    className: mergedClassName,
  });
};

export default ButtonAnimationWrapper;
