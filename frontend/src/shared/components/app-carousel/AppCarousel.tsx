import './AppCarousel.scss';
import { useEffect, useRef, useState } from 'react';
import { Carousel } from 'antd';
import { CarouselRef } from 'antd/es/carousel';

export interface ISlideInterface {
  id: number;
  innerImage?: string;
  title?: string;
  subtitle?: string;
  alt?: string;
  actionButton?: { label: string; url: string };
  footerText?: string;
  footerLink?: { label: string; url: string };
}

export type AppCarouselProps = {
  slides: string[]; // images
  initialSlide?: number;
  className?: string;
  arrowsColor?: string;
  infinite?: boolean;
  autoplay?: boolean;
  activeSlide?: number;
  onSlideChange?: (slideIndex: number) => void;
};

export const AppCarousel = ({
  slides,
  initialSlide = 0,
  className,
  arrowsColor,
  infinite = true,
  autoplay = true,
  activeSlide,
  onSlideChange,
}: AppCarouselProps) => {
  const carouselRef = useRef<CarouselRef>(null);
  const currentSlideRef = useRef(0);
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(autoplay);
  const autoplaySpeedMs = 5000;

  // Stop autoplay when user interacts with the carousel (manual slide, tap, or keyboard navigation).
  // Once stopped it stays off so the user keeps full control of slide navigation.
  const stopAutoplay = () => {
    if (!autoplay || !isAutoplayEnabled) return;
    setIsAutoplayEnabled(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') {
      e.preventDefault();
      stopAutoplay();
      if (e.key === 'ArrowLeft') {
        carouselRef.current?.prev();
      } else {
        carouselRef.current?.next();
      }
    }
  };

  const clampedInitialSlide =
    slides.length > 0 ? Math.max(0, Math.min(initialSlide, slides.length - 1)) : 0;

  useEffect(() => {
    if (activeSlide === undefined || slides.length === 0) return;

    const clampedSlide = Math.max(0, Math.min(activeSlide, slides.length - 1));
    if (currentSlideRef.current === clampedSlide) return;

    carouselRef.current?.goTo(clampedSlide, false);
  }, [activeSlide, slides.length]);

  const handleAfterChange = (slideIndex: number) => {
    currentSlideRef.current = slideIndex;
    onSlideChange?.(slideIndex);
  };

  return (
    <div
      className={`carousel-wrapper${className ? ` ${className}` : ''}`}
      onMouseDown={stopAutoplay}
      onTouchStart={stopAutoplay}
      onKeyDown={onKeyDown}
      tabIndex={0}
      style={
        {
          '--arrowsColor': arrowsColor,
        } as React.CSSProperties
      }
    >
      <Carousel
        ref={carouselRef}
        initialSlide={clampedInitialSlide}
        infinite={infinite}
        dots
        draggable
        autoplay={autoplay && isAutoplayEnabled}
        autoplaySpeed={autoplaySpeedMs}
        dotPosition="bottom"
        className="carousel-container"
        afterChange={handleAfterChange}
        arrows={true}
      >
        {slides.map((slide, i) => (
          <div key={i}>
            <div className="slide-outer">
              <img src={slide} alt={`Slide ${i + 1}`}/>
            </div>
          </div>
        ))}
      </Carousel>
    </div>
  );
};
