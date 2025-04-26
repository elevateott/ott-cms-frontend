// 'use client'

// import type { PayloadComponent } from 'payload'
// import { useState } from 'react'
// import type { CollapsibleUIFieldProps } from '@/types/UIFieldProps'

// export const CollapsibleInstructions: PayloadComponent<never, CollapsibleUIFieldProps> = (
//   props,
// ) => {
//   const { path, field, value, onChange } = props

//   const [open, setOpen] = useState(false)

//   return (
//     <div style={{ marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
//       <button
//         type="button"
//         onClick={() => setOpen(!open)}
//         style={{
//           width: '100%',
//           textAlign: 'left',
//           padding: '0.75rem 1rem',
//           backgroundColor: '#f9f9f9',
//           border: 'none',
//           borderTopLeftRadius: '8px',
//           borderTopRightRadius: '8px',
//           cursor: 'pointer',
//           fontWeight: 'bold',
//         }}
//       >
//         Instructions {open ? '▲' : '▼'}
//       </button>
//       {open && (
//         <div style={{ padding: '1rem', backgroundColor: '#fff' }}>
//           <p>Follow these rules carefully:</p>
//           <ul>
//             <li>
//               <strong>Setting A:</strong> Must always be filled.
//             </li>
//             <li>
//               <strong>Setting B:</strong> Optional but recommended.
//             </li>
//             <li>Contact support if needed.</li>
//           </ul>
//         </div>
//       )}
//     </div>
//   )
// }

// export default CollapsibleInstructions
