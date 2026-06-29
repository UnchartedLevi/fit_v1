export function ProductVisual({name,image,className=""}:{name:string;image?:string;className?:string}){
 return <div className={`product-visual ${className}`} style={image?{backgroundImage:`url(${image})`}:undefined}>
  {!image&&<><span className="visual-mark">FITS</span><span className="visual-name">{name}</span></>}
 </div>
}

