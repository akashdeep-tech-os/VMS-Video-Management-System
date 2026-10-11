from pydantic import BaseModel, ConfigDict, Field

# The frontend sends/reads camelCase (mediaMtxPath, startTime, ...) - the
# field names stay snake_case, the aliases carry the wire format.
DATE_PATTERN = r"^\d{4}-\d{2}-\d{2}$"
TIME_PATTERN = r"^\d{2}:\d{2}:\d{2}$"


class PlaybackStartRequest(BaseModel):
    """Start (or seek) recorded playback for one camera at one point in time."""

    model_config = ConfigDict(populate_by_name=True)

    camera_id: int = Field(..., alias="cameraId", ge=1)
    date: str = Field(..., pattern=DATE_PATTERN, description="yyyy-MM-dd (local)")
    time: str = Field(..., pattern=TIME_PATTERN, description="HH:mm:ss (local)")
    end_time: str | None = Field(
        default=None,
        alias="endTime",
        pattern=TIME_PATTERN,
        description="HH:mm:ss window end; defaults to 23:59:59 of the same day",
    )


class PlaybackResponse(BaseModel):
    """Mirror of the playback contract the frontend already consumes."""

    model_config = ConfigDict(populate_by_name=True)

    camera_id: int = Field(alias="cameraId")
    date: str
    start_time: str = Field(alias="startTime")
    end_time: str = Field(alias="endTime")
    media_mtx_path: str = Field(alias="mediaMtxPath")
    webrtc_url: str = Field(alias="webrtcUrl")
    status: str = "playing"
