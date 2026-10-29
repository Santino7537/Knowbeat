import ExerciseSlide from "./ExerciseSlide.jsx";
import InfoSlide from "./InfoSlide.jsx";

const slideRenderers = {
  info: InfoSlide,
  exercise: ExerciseSlide
};

const SlideRenderer = ({ slide, answers, onSelectOption, onSubmitAnswer }) => {
  const Renderer = slideRenderers[slide.type];
  if (!Renderer) return <p role="alert">Este tipo de diapositiva no está disponible.</p>;

  if (slide.type === "exercise") {
    return (
      <Renderer
        slide={slide}
        answers={answers}
        onSelectOption={onSelectOption}
        onSubmitAnswer={onSubmitAnswer}
      />
    );
  }

  return <Renderer slide={slide} />;
};

export default SlideRenderer;
