import Addcamera from "../../pages/Addcamera";

const AddCameraSettings = ({ department, onBack }) => {
  return (
    <div className="h-full">
      <Addcamera onBack={onBack} />
    </div>
  );
};

export default AddCameraSettings;