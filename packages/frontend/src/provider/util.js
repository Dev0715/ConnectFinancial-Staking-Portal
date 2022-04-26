import { VoidSigner, utils } from "ethers";

export class WrappedSigner extends VoidSigner {
  constructor(signer) {
    super(signer.getAddress(), signer.provider);
    this.signer = signer;
    window.signer = this;
  }
  setUser(i) {
    this.signer = this.provider.getSigner(i);
  }
}
