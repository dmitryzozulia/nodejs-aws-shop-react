import React, { useState } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import axios from "axios";

type CSVFileImportProps = {
  url: string;
  title: string;
};

export default function CSVFileImport({ url, title }: CSVFileImportProps) {
  const [file, setFile] = useState<File>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(undefined);
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Validate file type if needed
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Please select a CSV file");
        return;
      }
      setFile(file);
    }
  };

  const removeFile = () => {
    setFile(undefined);
    setError(undefined);
  };

  const uploadFile = async () => {
    if (!file) {
      setError("No file selected");
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      // Step 1: Get the pre-signed URL
      const headers: Record<string, string> = {};
      const token = localStorage.getItem("authorization_token");
      if (token) {
        headers.Authorization = `Basic ${token}`;
      }

      const { data: presignedUrl } = await axios({
        method: "GET",
        url,
        params: {
          name: encodeURIComponent(file.name),
        },
        headers,
      });

      console.log(presignedUrl);

      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": "text/csv",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      // Clear the file input after successful upload
      setFile(undefined);

      // Optional: Show success message
      console.log("File uploaded successfully");
    } catch (err) {
      // Handle different types of errors
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError(
            "Can not upload file: Unauthorized. Please check if token exists."
          );
        } else if (err.response?.status === 403) {
          setError(
            "Can not upload file: Access denied. Please check if token is correct."
          );
        } else {
          setError(`Failed to get upload URL: ${err.message}`);
        }
      } else {
        setError(
          `Upload failed: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      {error && (
        <Typography color="error" variant="body2" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {!file ? (
        <Box>
          <input
            type="file"
            accept=".csv"
            onChange={onFileChange}
            disabled={loading}
          />
        </Box>
      ) : (
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Typography variant="body2">Selected file: {file.name}</Typography>
          <button onClick={removeFile} disabled={loading}>
            Remove file
          </button>
          <button onClick={uploadFile} disabled={loading}>
            {loading ? "Uploading..." : "Upload file"}
          </button>
        </Box>
      )}
    </Box>
  );
}

