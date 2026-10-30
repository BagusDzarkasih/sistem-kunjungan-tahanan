// Menampilkan foto yang butuh login (KTP atau foto pembesuk).
// Foto diambil sebagai blob lewat axios (membawa token), lalu dipasang lewat URL sementara.
// Klik foto untuk memperbesar.
import { useEffect, useState } from 'react';
import { Box, Dialog, Skeleton, Typography } from '@mui/material';
import { getPhotoBlob } from '../services/visit.service';

export default function AuthPhoto({ type, id, alt }) {
  const key = `${type}:${id}`;
  const [photo, setPhoto] = useState({ key: '', url: '', failed: false });
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = '';

    getPhotoBlob(type, id)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPhoto({ key, url: objectUrl, failed: false });
      })
      .catch(() => {
        if (!cancelled) setPhoto({ key, url: '', failed: true });
      });

    // Bersihkan URL sementara supaya memori tidak menumpuk.
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [type, id, key]);

  const loading = photo.key !== key;

  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
        {alt}
      </Typography>

      {loading && <Skeleton variant="rounded" sx={{ width: '100%', aspectRatio: '4 / 3' }} />}

      {!loading && photo.failed && (
        <Box
          sx={{
            aspectRatio: '4 / 3',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 1,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Foto tidak tersedia
          </Typography>
        </Box>
      )}

      {!loading && photo.url && (
        <>
          <Box
            component="img"
            src={photo.url}
            alt={alt}
            onClick={() => setZoom(true)}
            sx={{
              width: '100%',
              aspectRatio: '4 / 3',
              objectFit: 'cover',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
              cursor: 'zoom-in',
              display: 'block',
            }}
          />
          <Dialog open={zoom} onClose={() => setZoom(false)} maxWidth="md">
            <Box
              component="img"
              src={photo.url}
              alt={alt}
              onClick={() => setZoom(false)}
              sx={{ maxWidth: '100%', maxHeight: '90vh', display: 'block', cursor: 'zoom-out' }}
            />
          </Dialog>
        </>
      )}
    </Box>
  );
}