import WidgetConfig from '../componentDescription/WidgetConfig'
export default function renderJustAddressLink(data, variables, chainId) {
  const div = document.createElement('div');
  div.classList.add('text-truncate');
  const link = document.createElement('a');
  // link.setAttribute('target', '_blank');
  link.href = `/${WidgetConfig.getNetwork(chainId)}/address/${data}`; // Change  URL
  link.textContent = data;

  div.appendChild(link);
  return div;
}
