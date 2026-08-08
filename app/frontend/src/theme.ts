import { createTheme } from "@mui/material/styles";

const DERCO_RED = "#E4002B";
const INK = "#1A1A1A";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: DERCO_RED, contrastText: "#ffffff" },
    secondary: { main: INK, contrastText: "#ffffff" },
    background: { default: "#f2f2f2", paper: "#ffffff" },
    text: { primary: INK, secondary: "#6b6b6b" },
    divider: "#e0e0e0",
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: '"Segoe UI", Roboto, system-ui, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#f2f2f2" },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: INK,
          color: "#ffffff",
          borderBottom: `3px solid ${DERCO_RED}`,
          boxShadow: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#ffffff",
          borderRight: "1px solid #e0e0e0",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderLeft: "3px solid transparent",
          "&.Mui-selected": {
            backgroundColor: "rgba(228, 0, 43, 0.08)",
            borderLeft: `3px solid ${DERCO_RED}`,
            "& .MuiListItemIcon-root": { color: DERCO_RED },
            "& .MuiListItemText-primary": { color: DERCO_RED, fontWeight: 600 },
          },
          "&.Mui-selected:hover": {
            backgroundColor: "rgba(228, 0, 43, 0.12)",
          },
          "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600 },
      },
      variants: [
        {
          props: { variant: "contained", color: "primary" },
          style: { "&:hover": { backgroundColor: "#c40025" } },
        },
      ],
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600 } },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
        outlined: { borderColor: "#e0e0e0" },
      },
    },
  },
});
