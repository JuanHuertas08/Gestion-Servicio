import { useState, type ReactElement } from "react";
import { Outlet, useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/DashboardOutlined";
import GroupIcon from "@mui/icons-material/GroupOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLongOutlined";
import EventNoteIcon from "@mui/icons-material/EventNoteOutlined";
import LogoutIcon from "@mui/icons-material/LogoutOutlined";
import LockResetIcon from "@mui/icons-material/LockResetOutlined";
import { useAuth } from "../auth/AuthContext";
import type { Rol } from "../api/types";

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  path: string;
  icon: ReactElement;
  roles: Rol[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Tablero", path: "/", icon: <DashboardIcon />, roles: ["ADMINISTRADOR", "ASESOR", "CONSULTA"] },
  { label: "Usuarios", path: "/usuarios", icon: <GroupIcon />, roles: ["ADMINISTRADOR"] },
  {
    label: "Facturación",
    path: "/facturacion",
    icon: <ReceiptLongIcon />,
    roles: ["ADMINISTRADOR"],
  },
  {
    label: "Proyección de seguimiento",
    path: "/proyeccion",
    icon: <EventNoteIcon />,
    roles: ["ADMINISTRADOR", "ASESOR"],
  },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  if (!user) return null;

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.rol));

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Control Servicio
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            {user.nombres} {user.apellidos} · {user.rol}
          </Typography>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main" }}>
              {user.nombres.charAt(0)}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                navigate("/cambiar-password");
              }}
            >
              <ListItemIcon>
                <LockResetIcon fontSize="small" />
              </ListItemIcon>
              Cambiar contraseña
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Cerrar sesión
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <List>
          {items.map((item) => (
            <ListItemButton
              key={item.path}
              component={RouterLink}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
