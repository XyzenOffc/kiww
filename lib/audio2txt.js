const WebSocket = require("ws");
const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");

const baseurl = "https://hf-audio-whisper-large-v3.hf.space"
const headers = {//gapake cookie atau user-agent juga bisa kok
  "cookie": "_gid=GA1.2.347908990.1703681809; _ga_R1FN4KJKJH=GS1.1.1703681808.1.1.1703682843.0.0.0; _ga=GA1.2.1811857550.1703681808; _gat_gtag_UA_156449732_1=1",
  "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
};

const uploadStream = async (upload_id) => {
  return new Promise((resolve, reject) => {
    const res = [];
    axios.get(`${baseurl}/upload_progress?upload_id=${upload_id}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        ...headers
      },
      responseType: 'stream'
    })
      .then(response => {
        response.data.on('data', eventData => {
          res.push(eventData.toString());
        });
        response.data.on('end', () => {
          resolve({ msg: "success", data: res });
        });
      })
      .catch(error => reject(error));
  });
};

const audio2txt = async (file) => {
  try {
    const fd = new FormData();
    const upload_id = Math.random().toString(36).substring(2, 15);
    const filename = `${Math.random()}.mp3`;

    fd.append("files", file, { filename });

    headers["content-type"] = "multipart/form-data";

    const { data } = await axios.post(`${baseurl}/upload?upload_id=${upload_id}`, fd, { headers });

    await uploadStream(upload_id);

    await axios.post(baseurl +"/queue/join?__theme=light", {
      data: [
        {
          path: data[0],
          url: `${baseurl}/file=${data[0]}`,
          orig_name: filename,
          size: file.length,
          mime_type: "audio/mp3",
          meta: { "_type": "gradio.FileData" }
        },
        "transcribe"
      ],
      event_data: null,
      fn_index: 3,
      trigger_id: 29,
      session_hash: "9rv4vgns37"
    });

    const transcription = await new Promise((resolve, reject) => {
      axios.get(baseurl +"/queue/data?session_hash=9rv4vgns37", {
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'text/event-stream',
          'Connection': 'keep-alive',
          ...headers
        },
        responseType: 'stream'
      })
        .then(response => {
          response.data.on('data', async eventData => {
            const son = JSON.parse(eventData.toString().split("data:")[1].trim());
            const msg = son?.msg;
            if (msg) {
              switch (msg) {
                case 'estimation':
                  console.log(`Rank: ${son.rank}`);
                  break;
                case 'process_completed':
                  resolve({ author: "@ShinChan", transcribe: son.output.data[0] })//hargai pembuat, author jangan diganti!
                  break;
              }
            }
          });
        })
        .catch(error => reject(error));
    });

    return transcription;
  } catch (error) {
    console.error("Error in audio2txt:", error);
    throw error;
  }
};

module.exports = { audio2txt };