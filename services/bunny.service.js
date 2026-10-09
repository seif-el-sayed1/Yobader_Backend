const crypto = require("crypto");
const ApiError = require("../utils/ApiError"); 

class BunnyService {
    createVideo = async (title) => {
        const res = await fetch(
            `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos`,
            {
                method: "POST",
                headers: {
                    AccessKey: process.env.BUNNY_API_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ title })
            }
        );

        if (!res.ok) throw new ApiError("Failed to create video", 502);
        return res.json();
    };

    signUpload = (videoId) => {
        const expire = Math.floor(Date.now() / 1000) + 3600;
        const signature = crypto
            .createHash("sha256")
            .update(`${process.env.BUNNY_LIBRARY_ID}${process.env.BUNNY_API_KEY}${expire}${videoId}`)
            .digest("hex");

        return {
            videoId,
            libraryId: process.env.BUNNY_LIBRARY_ID,
            signature,
            expire
        };
    };


}

module.exports = new BunnyService();