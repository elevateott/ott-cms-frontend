/**
 * OBS Scene Collection Templates for Multi-Camera Setups
 * 
 * These templates provide pre-configured scene collections that users can import into OBS Studio.
 * They include multiple scenes for different camera angles and layouts.
 */

// Basic Scene Collection with 4 scenes for a two-camera setup
export const basicSceneCollection = {
  name: "Basic Multi-Camera Setup",
  scenes: [
    {
      name: "Camera 1 (Full Screen)",
      sources: [
        {
          name: "Camera 1",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_1",
            resolution: "1920x1080",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_1"
          }
        }
      ]
    },
    {
      name: "Camera 2 (Full Screen)",
      sources: [
        {
          name: "Camera 2",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_2",
            resolution: "1920x1080",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_2"
          }
        }
      ]
    },
    {
      name: "Picture-in-Picture",
      sources: [
        {
          name: "Camera 1",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_1",
            resolution: "1920x1080",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_1"
          },
          position: {
            x: 0,
            y: 0,
            width: 1920,
            height: 1080
          }
        },
        {
          name: "Camera 2 (Small)",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_2",
            resolution: "1280x720",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_2",
            audio_output_mode: 0 // Muted
          },
          position: {
            x: 1440,
            y: 720,
            width: 480,
            height: 270
          }
        }
      ]
    },
    {
      name: "Side-by-Side",
      sources: [
        {
          name: "Camera 1",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_1",
            resolution: "1280x720",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_1"
          },
          position: {
            x: 0,
            y: 180,
            width: 960,
            height: 720
          }
        },
        {
          name: "Camera 2",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_2",
            resolution: "1280x720",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_2",
            audio_output_mode: 0 // Muted
          },
          position: {
            x: 960,
            y: 180,
            width: 960,
            height: 720
          }
        }
      ]
    }
  ],
  transitions: [
    {
      name: "Fade",
      type: "fade_transition",
      duration: 300
    },
    {
      name: "Cut",
      type: "cut_transition",
      duration: 0
    }
  ],
  hotkeys: [
    {
      key: "OBS_KEY_1",
      action: "OBS_KEY_SWITCH_TO_SCENE",
      scene: "Camera 1 (Full Screen)"
    },
    {
      key: "OBS_KEY_2",
      action: "OBS_KEY_SWITCH_TO_SCENE",
      scene: "Camera 2 (Full Screen)"
    },
    {
      key: "OBS_KEY_3",
      action: "OBS_KEY_SWITCH_TO_SCENE",
      scene: "Picture-in-Picture"
    },
    {
      key: "OBS_KEY_4",
      action: "OBS_KEY_SWITCH_TO_SCENE",
      scene: "Side-by-Side"
    }
  ],
  stream_settings: {
    service: "Custom",
    server: "rtmp://global-live.mux.com:5222/app",
    key: "PLACEHOLDER_STREAM_KEY"
  },
  output_settings: {
    video: {
      encoder: "x264",
      rate_control: "CBR",
      bitrate: 4500,
      keyframe_interval: 2,
      preset: "veryfast",
      profile: "high",
      tune: "zerolatency",
      resolution: {
        width: 1920,
        height: 1080
      },
      fps: 30
    },
    audio: {
      encoder: "aac",
      bitrate: 160,
      sample_rate: 48000,
      channels: 2
    }
  }
};

// Advanced Scene Collection with 8 scenes for a professional multi-camera setup
export const advancedSceneCollection = {
  name: "Advanced Multi-Camera Setup",
  scenes: [
    {
      name: "Starting Soon",
      sources: [
        {
          name: "Background",
          type: "color_source",
          settings: {
            color: "#1f1f1f",
            width: 1920,
            height: 1080
          }
        },
        {
          name: "Starting Soon Text",
          type: "text_source",
          settings: {
            text: "Stream Starting Soon",
            font: {
              face: "Arial",
              size: 72,
              style: "Bold"
            },
            color: "#ffffff",
            outline: true,
            outline_color: "#000000",
            outline_size: 2
          },
          position: {
            x: 960,
            y: 540,
            alignment: "center"
          }
        },
        {
          name: "Event Title",
          type: "text_source",
          settings: {
            text: "PLACEHOLDER_EVENT_TITLE",
            font: {
              face: "Arial",
              size: 36,
              style: "Regular"
            },
            color: "#ffffff"
          },
          position: {
            x: 960,
            y: 640,
            alignment: "center"
          }
        }
      ]
    },
    {
      name: "Camera 1 (Wide)",
      sources: [
        {
          name: "Camera 1",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_1",
            resolution: "1920x1080",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_1"
          }
        },
        {
          name: "Lower Third",
          type: "group",
          settings: {
            items: [
              {
                name: "Lower Third Background",
                type: "color_source",
                settings: {
                  color: "#3498db",
                  width: 600,
                  height: 100
                },
                position: {
                  x: 50,
                  y: 900
                }
              },
              {
                name: "Lower Third Text",
                type: "text_source",
                settings: {
                  text: "PLACEHOLDER_SPEAKER_NAME",
                  font: {
                    face: "Arial",
                    size: 32,
                    style: "Bold"
                  },
                  color: "#ffffff"
                },
                position: {
                  x: 70,
                  y: 925
                }
              }
            ],
            visible: false
          }
        }
      ]
    },
    {
      name: "Camera 2 (Close-Up)",
      sources: [
        {
          name: "Camera 2",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_2",
            resolution: "1920x1080",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_2",
            audio_output_mode: 0 // Muted
          }
        },
        {
          name: "Lower Third",
          type: "group",
          settings: {
            items: [
              {
                name: "Lower Third Background",
                type: "color_source",
                settings: {
                  color: "#3498db",
                  width: 600,
                  height: 100
                },
                position: {
                  x: 50,
                  y: 900
                }
              },
              {
                name: "Lower Third Text",
                type: "text_source",
                settings: {
                  text: "PLACEHOLDER_SPEAKER_NAME",
                  font: {
                    face: "Arial",
                    size: 32,
                    style: "Bold"
                  },
                  color: "#ffffff"
                },
                position: {
                  x: 70,
                  y: 925
                }
              }
            ],
            visible: false
          }
        }
      ]
    },
    {
      name: "Camera 3 (Alternative Angle)",
      sources: [
        {
          name: "Camera 3",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_3",
            resolution: "1920x1080",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_3",
            audio_output_mode: 0 // Muted
          }
        },
        {
          name: "Lower Third",
          type: "group",
          settings: {
            items: [
              {
                name: "Lower Third Background",
                type: "color_source",
                settings: {
                  color: "#3498db",
                  width: 600,
                  height: 100
                },
                position: {
                  x: 50,
                  y: 900
                }
              },
              {
                name: "Lower Third Text",
                type: "text_source",
                settings: {
                  text: "PLACEHOLDER_SPEAKER_NAME",
                  font: {
                    face: "Arial",
                    size: 32,
                    style: "Bold"
                  },
                  color: "#ffffff"
                },
                position: {
                  x: 70,
                  y: 925
                }
              }
            ],
            visible: false
          }
        }
      ]
    },
    {
      name: "Picture-in-Picture (Main + Close-Up)",
      sources: [
        {
          name: "Camera 1",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_1",
            resolution: "1920x1080",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_1"
          },
          position: {
            x: 0,
            y: 0,
            width: 1920,
            height: 1080
          }
        },
        {
          name: "Camera 2 (Small)",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_2",
            resolution: "1280x720",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_2",
            audio_output_mode: 0 // Muted
          },
          position: {
            x: 1440,
            y: 720,
            width: 480,
            height: 270
          }
        },
        {
          name: "PiP Border",
          type: "color_source",
          settings: {
            color: "#ffffff",
            width: 490,
            height: 280
          },
          position: {
            x: 1435,
            y: 715
          },
          order: -1 // Behind the camera
        }
      ]
    },
    {
      name: "Side-by-Side Equal",
      sources: [
        {
          name: "Camera 1",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_1",
            resolution: "1280x720",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_1"
          },
          position: {
            x: 0,
            y: 180,
            width: 960,
            height: 720
          }
        },
        {
          name: "Camera 2",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_2",
            resolution: "1280x720",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_2",
            audio_output_mode: 0 // Muted
          },
          position: {
            x: 960,
            y: 180,
            width: 960,
            height: 720
          }
        },
        {
          name: "Divider",
          type: "color_source",
          settings: {
            color: "#ffffff",
            width: 4,
            height: 720
          },
          position: {
            x: 958,
            y: 180
          }
        }
      ]
    },
    {
      name: "Three Camera Grid",
      sources: [
        {
          name: "Camera 1",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_1",
            resolution: "1280x720",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_1"
          },
          position: {
            x: 0,
            y: 0,
            width: 960,
            height: 540
          }
        },
        {
          name: "Camera 2",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_2",
            resolution: "1280x720",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_2",
            audio_output_mode: 0 // Muted
          },
          position: {
            x: 960,
            y: 0,
            width: 960,
            height: 540
          }
        },
        {
          name: "Camera 3",
          type: "dshow_input",
          settings: {
            video_device_id: "PLACEHOLDER_CAMERA_3",
            resolution: "1280x720",
            fps: 30,
            audio_device_id: "PLACEHOLDER_MIC_3",
            audio_output_mode: 0 // Muted
          },
          position: {
            x: 480,
            y: 540,
            width: 960,
            height: 540
          }
        }
      ]
    },
    {
      name: "Stream Ending",
      sources: [
        {
          name: "Background",
          type: "color_source",
          settings: {
            color: "#1f1f1f",
            width: 1920,
            height: 1080
          }
        },
        {
          name: "Ending Text",
          type: "text_source",
          settings: {
            text: "Thanks for Watching!",
            font: {
              face: "Arial",
              size: 72,
              style: "Bold"
            },
            color: "#ffffff",
            outline: true,
            outline_color: "#000000",
            outline_size: 2
          },
          position: {
            x: 960,
            y: 540,
            alignment: "center"
          }
        },
        {
          name: "Event Title",
          type: "text_source",
          settings: {
            text: "PLACEHOLDER_EVENT_TITLE",
            font: {
              face: "Arial",
              size: 36,
              style: "Regular"
            },
            color: "#ffffff"
          },
          position: {
            x: 960,
            y: 640,
            alignment: "center"
          }
        }
      ]
    }
  ],
  transitions: [
    {
      name: "Fade",
      type: "fade_transition",
      duration: 300
    },
    {
      name: "Cut",
      type: "cut_transition",
      duration: 0
    },
    {
      name: "Swipe",
      type: "swipe_transition",
      duration: 500
    },
    {
      name: "Slide",
      type: "slide_transition",
      duration: 500
    }
  ],
  hotkeys: [
    {
      key: "OBS_KEY_1",
      action: "OBS_KEY_SWITCH_TO_SCENE",
      scene: "Camera 1 (Wide)"
    },
    {
      key: "OBS_KEY_2",
      action: "OBS_KEY_SWITCH_TO_SCENE",
      scene: "Camera 2 (Close-Up)"
    },
    {
      key: "OBS_KEY_3",
      action: "OBS_KEY_SWITCH_TO_SCENE",
      scene: "Camera 3 (Alternative Angle)"
    },
    {
      key: "OBS_KEY_4",
      action: "OBS_KEY_SWITCH_TO_SCENE",
      scene: "Picture-in-Picture (Main + Close-Up)"
    },
    {
      key: "OBS_KEY_5",
      action: "OBS_KEY_SWITCH_TO_SCENE",
      scene: "Side-by-Side Equal"
    },
    {
      key: "OBS_KEY_6",
      action: "OBS_KEY_SWITCH_TO_SCENE",
      scene: "Three Camera Grid"
    },
    {
      key: "OBS_KEY_7",
      action: "OBS_KEY_SWITCH_TO_SCENE",
      scene: "Starting Soon"
    },
    {
      key: "OBS_KEY_8",
      action: "OBS_KEY_SWITCH_TO_SCENE",
      scene: "Stream Ending"
    },
    {
      key: "OBS_KEY_L",
      action: "OBS_KEY_TOGGLE_SOURCE_VISIBILITY",
      scene: "Camera 1 (Wide)",
      source: "Lower Third"
    },
    {
      key: "OBS_KEY_L",
      action: "OBS_KEY_TOGGLE_SOURCE_VISIBILITY",
      scene: "Camera 2 (Close-Up)",
      source: "Lower Third"
    },
    {
      key: "OBS_KEY_L",
      action: "OBS_KEY_TOGGLE_SOURCE_VISIBILITY",
      scene: "Camera 3 (Alternative Angle)",
      source: "Lower Third"
    }
  ],
  stream_settings: {
    service: "Custom",
    server: "rtmp://global-live.mux.com:5222/app",
    key: "PLACEHOLDER_STREAM_KEY"
  },
  output_settings: {
    video: {
      encoder: "x264",
      rate_control: "CBR",
      bitrate: 4500,
      keyframe_interval: 2,
      preset: "veryfast",
      profile: "high",
      tune: "zerolatency",
      resolution: {
        width: 1920,
        height: 1080
      },
      fps: 30
    },
    audio: {
      encoder: "aac",
      bitrate: 160,
      sample_rate: 48000,
      channels: 2
    }
  }
};
