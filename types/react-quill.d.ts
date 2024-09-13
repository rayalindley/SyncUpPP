declare module "react-quill" {
  import { Component } from "react";

  interface ReactQuillProps {
    value: string;
    onChange: (content: string) => void;
    // Add other props as needed
  }

  export default class ReactQuill extends Component<ReactQuillProps> {}
}
