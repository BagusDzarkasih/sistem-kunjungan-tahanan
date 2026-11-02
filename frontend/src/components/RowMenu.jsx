// Menu titik tiga untuk aksi satu baris (dipakai di tampilan HP).
// items: [{ label, onClick, color?, hidden?, disabled? }]
import { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export default function RowMenu({ items, label = 'Aksi lainnya' }) {
  const [anchor, setAnchor] = useState(null);
  const visible = items.filter((i) => !i.hidden);

  return (
    <>
      <IconButton aria-label={label} onClick={(e) => setAnchor(e.currentTarget)} sx={{ width: 44, height: 44 }}>
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {visible.map((item) => (
          <MenuItem
            key={item.label}
            disabled={item.disabled}
            sx={{ minHeight: 44, color: item.color }}
            onClick={() => {
              setAnchor(null);
              item.onClick();
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
