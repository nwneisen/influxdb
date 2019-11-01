// Libraries
import React, {FunctionComponent} from 'react'

// Components
import CellHeaderNote from 'src/shared/components/cells/CellHeaderNote'

interface Props {
  name: string
  note: string
}

const CellHeader: FunctionComponent<Props> = ({name, note, children}) => {
  return (
    <div className="cell--header">
      <div className="cell--draggable">
        <div className="cell--hamburger" />
      </div>
      <div className="cell--name">{name}</div>
      {note && <CellHeaderNote note={note} />}
      {children}
    </div>
  )
}

export default CellHeader
