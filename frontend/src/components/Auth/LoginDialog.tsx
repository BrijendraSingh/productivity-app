import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tab,
  Tabs,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Close } from '@mui/icons-material';
import { APP_CONFIG } from '@productivity-app/shared';
import { useAuth } from '../../contexts/AuthContext';

interface LoginDialogProps {
  open: boolean;
  onClose: () => void;
  initialTab?: number;
}

export function LoginDialog({
  open,
  onClose,
  initialTab = 0,
}: LoginDialogProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);

  // Sync tab when dialog opens with a different initialTab
  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const resetFields = () => {
    setLoginUsername('');
    setLoginPassword('');
    setSignupUsername('');
    setSignupEmail('');
    setSignupPassword('');
    setSignupConfirm('');
    setError(null);
    setShowPassword(false);
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ username: loginUsername, password: loginPassword });
      handleClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (signupPassword.length < APP_CONFIG.PASSWORD_MIN_LENGTH) {
      setError(
        `Password must be at least ${APP_CONFIG.PASSWORD_MIN_LENGTH} characters`,
      );
      return;
    }
    if (signupPassword !== signupConfirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: signupUsername,
        email: signupEmail,
        password: signupPassword,
      });
      handleClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const passwordAdornment = (
    <InputAdornment position="end">
      <IconButton
        aria-label="toggle password visibility"
        onClick={() => setShowPassword(!showPassword)}
        edge="end"
        size="small"
      >
        {showPassword ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 0,
        }}
      >
        Welcome
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            setError(null);
          }}
          centered
        >
          <Tab label="Sign In" />
          <Tab label="Sign Up" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mx: 3, mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* ─── Login Tab ─── */}
      {tab === 0 && (
        <form onSubmit={handleLogin}>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              margin="dense"
              label="Username"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              required
            />
            <TextField
              fullWidth
              margin="dense"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              slotProps={{
                input: { endAdornment: passwordAdornment },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </DialogActions>
        </form>
      )}

      {/* ─── Signup Tab ─── */}
      {tab === 1 && (
        <form onSubmit={handleSignup}>
          <DialogContent sx={{ pt: 2 }}>
            <TextField
              autoFocus
              fullWidth
              margin="dense"
              label="Username"
              value={signupUsername}
              onChange={(e) => setSignupUsername(e.target.value)}
              required
            />
            <TextField
              fullWidth
              margin="dense"
              label="Email"
              type="email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              required
            />
            <TextField
              fullWidth
              margin="dense"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
              helperText={`Min ${APP_CONFIG.PASSWORD_MIN_LENGTH} characters`}
              slotProps={{
                input: { endAdornment: passwordAdornment },
              }}
            />
            <TextField
              fullWidth
              margin="dense"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={signupConfirm}
              onChange={(e) => setSignupConfirm(e.target.value)}
              required
              error={
                signupConfirm.length > 0 &&
                signupPassword !== signupConfirm
              }
              helperText={
                signupConfirm.length > 0 &&
                signupPassword !== signupConfirm
                  ? 'Passwords do not match'
                  : ''
              }
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
}
