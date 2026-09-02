
import { makeStyles } from "@mui/styles";

export const useLoginStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    "@media (max-width: 768px)": {
      marginTop: theme.spacing(4),
    },
  },
  avatar: {
    margin: theme.spacing(1),
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  input: {
    border: `1px solid ${theme.palette.primary.main}`,
  }
}));
