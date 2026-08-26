import AddCamera from "../../pages/settings/AddCamera";

const AddCameraSettings = ({ department, onBack }) => {
  return (
    <div className="h-full">
      <AddCamera onBack={onBack} />
    </div>
  );
};

export default AddCameraSettings;