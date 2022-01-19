import {Theme} from '@mui/material';
import useSystemTheme from './useSystemTheme';
import {useAppSelector} from "../redux/hooks";
import {createSfTheme} from "./theme";
import {useEffect, useState} from "react";

const useSfTheme = (): Theme => {
  const isSystemDarkTheme = useSystemTheme();

  const {themePreference} = useAppSelector((state) => state.appPreferences);

  const [ muiTheme, setMuiTheme ] = useState<Theme>(themePreference === 'dark' ? createSfTheme('dark') : createSfTheme('light'));

  // System theme we'll handle client-side because server has no knowledge of system preferences.
  // NOTE: UseEffect runs only on client-side.
  useEffect(() => {
    if (themePreference === 'system') {
      if (isSystemDarkTheme && muiTheme.palette.mode !== 'dark') {
        setMuiTheme(createSfTheme('dark'));
      }
    }
  }, [themePreference]);

  return muiTheme;
};

export default useSfTheme;
