import torch
import torch.nn as nn
from pytorch_msssim import ssim as _ssim


def charbonnier(pred, target, eps=1e-3):
    p, t = pred.float(), target.float()
    return torch.mean(torch.sqrt((p - t) ** 2 + eps ** 2))


def fft_loss(pred, target):
    """Complex-L1 loss in the frequency domain, computed in float32 for numerical stability."""
    p, t = pred.float(), target.float()
    diff = torch.fft.rfft2(p, norm="ortho") - torch.fft.rfft2(t, norm="ortho")
    return torch.mean(torch.abs(diff))


def ssim_loss(pred, target):
    # single-scale SSIM (this is what the original notebook trained with, despite its "MS-SSIM" label)
    p, t = pred.float().clamp(0, 1), target.float().clamp(0, 1)
    return 1.0 - _ssim(p, t, data_range=1.0, size_average=True)


class MPRLoss(nn.Module):
    """Multi-stage supervision. MPRNet returns [stage3, stage2, stage1]."""
    def __init__(self, cw=0.5, fw=0.3, sw=0.2, stage_weights=(1.0, 0.5, 0.25)):
        super().__init__()
        self.cw, self.fw, self.sw, self.stage_weights = cw, fw, sw, stage_weights

    def forward(self, preds, tgt):
        stages = preds if isinstance(preds, (list, tuple)) else [preds]
        total = 0.0
        for i, out in enumerate(stages):
            w = self.stage_weights[i] if i < len(self.stage_weights) else 0.1
            total = total + w * (self.cw * charbonnier(out, tgt)
                                 + self.fw * fft_loss(out, tgt)
                                 + self.sw * ssim_loss(out, tgt))
        return total
